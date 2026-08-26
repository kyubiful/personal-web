---
title: 'Python 3.13: el JIT experimental y el modo Free-Threaded (sin GIL)'
pubDate: 2026-07-28
description: 'Python 3.13 llegó con dos funcionalidades experimentales y opcionales que atacan a la vez las dos limitaciones históricas del intérprete: un compilador JIT basado en copy-and-patch y una compilación libre de hilos que puede desactivar el GIL. Esto es lo que hace cada una, cómo probarlas hoy mismo y dónde todavía dan problemas.'
author: 'Sergio Zabala'
image:
  url: '/python.webp'
  alt: 'Python logo.'
tags: ['Python']
transitionSlug: 'python-3-13-jit-free-threading'
---

## Dos experimentos, un mismo lanzamiento

Python 3.13 (publicado en octubre de 2024) es la primera versión de CPython que incorpora a la vez un compilador just-in-time y una compilación capaz de ejecutarse sin el Global Interpreter Lock. Ninguna de las dos viene activada por defecto, y ninguna está pensada para producción todavía — el equipo core lo deja muy claro. Pero ambas apuntan a problemas reales y de larga data: la velocidad de ejecución de un solo hilo y la imposibilidad de usar hilos para paralelismo real ligado a CPU. Veamos qué resuelve cada una y cómo probarlas.

## El problema: dos tipos de lentitud distintos

CPython ha sido lento históricamente por dos motivos que no tienen relación entre sí:

- **Sobrecarga por instrucción.** Incluso con el intérprete adaptativo especializado que llegó en la 3.11, CPython sigue despachando y decodificando bytecode instrucción a instrucción, lo que limita la velocidad máxima de un único hilo.
- **El GIL.** El Global Interpreter Lock permite que solo un hilo ejecute bytecode de Python a la vez, sin importar cuántos núcleos de CPU haya disponibles. El paralelismo multinúcleo siempre ha requerido procesos separados (`multiprocessing`) en lugar de hilos, lo que trae su propia sobrecarga de serialización y comunicación entre procesos.

Python 3.13 introduce una respuesta experimental para cada uno de estos problemas.

## CPython Free-Threaded (sin GIL)

Esta funcionalidad viene de la **PEP 703** ("Making the Global Interpreter Lock Optional in CPython"), aceptada por el Steering Council en octubre de 2023. Añade una configuración de compilación que elimina el GIL, de modo que varios hilos pueden ejecutar bytecode de Python en paralelo, sobre núcleos distintos, de verdad.

La motivación es concreta: librerías de computación científica, carga de datos para ML y orquestación de GPUs llevan años necesitando workarounds basados en multiprocessing solo para esquivar el GIL, lo que complica el diseño de sus APIs y añade sobrecarga de coordinación. El free-threading apunta directamente a ese hueco.

Por debajo, la PEP 703 se apoya en biased reference counting (conteo de referencias no atómico y rápido para el caso común de un solo hilo), en "inmortalizar" objetos muy compartidos como `None`, `True` y los enteros pequeños, y en locks por objeto en lugar de un único lock global.

### Cómo probarlo

El modo free-threaded requiere un ejecutable distinto, normalmente `python3.13t` (o `python3.13t.exe` en Windows). Puedes conseguirlo así:

- Con los instaladores oficiales de Windows y macOS, que ofrecen una opción free-threaded.
- Compilando CPython desde el código fuente con `--disable-gil`.

Para confirmar que realmente estás ejecutando sin GIL:

```bash
python3.13t -VV
# busca "experimental free-threading build" en la cadena de versión
```

```python
import sys
sys._is_gil_enabled()  # False si el GIL está realmente desactivado
```

También puedes forzar el GIL de vuelta en tiempo de ejecución con `PYTHON_GIL=1` o `-X gil=1` — útil si dependes de alguna extensión en C que todavía no es thread-safe.

### Las salvedades

- **Es experimental.** Hay que contar con bugs y, sobre todo, con una penalización real de rendimiento en un solo hilo respecto a la compilación estándar.
- **Las extensiones en C necesitan soporte explícito.** Los módulos de extensión deben compilarse específicamente para el build free-threaded y declararlo mediante el slot `Py_mod_gil`. Importar una extensión que no lo haga reactiva silenciosamente el GIL para todo el proceso.
- **Herramientas.** Se necesita pip 24.1 o superior para instalar paquetes con extensiones en C en el build free-threaded.

## El compilador JIT experimental

Esta funcionalidad proviene de la **PEP 744** ("JIT Compilation"). En lugar de adoptar un framework pesado como LLVM en tiempo de ejecución, CPython usa una técnica llamada **copy-and-patch**: se generan plantillas de código máquina en tiempo de compilación a partir del mismo DSL que define las instrucciones de bytecode de CPython, y luego se personalizan con valores de tiempo de ejecución y se combinan durante la ejecución. La única dependencia es LLVM en tiempo de compilación — no hay ninguna dependencia en tiempo de ejecución.

A nivel de arquitectura, el bytecode "caliente" de Tier 1 se traduce a una representación intermedia interna de Tier 2 (micro-ops, o "uops"), que pasa por varias pasadas de optimización y después puede traducirse a código máquina nativo mediante el JIT, en lugar de despacharse instrucción por instrucción.

Esto se apoya directamente en el intérprete adaptativo especializado de la 3.11 y en el intérprete de micro-ops de Tier 2 introducido también en la 3.13 — el JIT es el siguiente paso después de ambos, orientado a eliminar la sobrecarga de despacho y decodificación que aún queda.

### Cómo probarlo

El JIT no viene en los binarios oficiales precompilados de la 3.13 — hay que compilar CPython uno mismo con:

```bash
./configure --enable-experimental-jit
```

Variantes útiles:

- `--enable-experimental-jit=yes-off` — compila el JIT pero lo deja desactivado por defecto; se activa en tiempo de ejecución con `PYTHON_JIT=1`.
- `--enable-experimental-jit=interpreter` — activa solo el intérprete de Tier 2 (útil para depuración), sin el JIT propiamente dicho.

En Windows, el equivalente es `PCbuild/build.bat --experimental-jit`.

### Las salvedades

La documentación oficial de CPython es directa al respecto: **las mejoras de rendimiento son modestas** en la 3.13 — el equipo espera irlas mejorando en las próximas versiones. No esperes ganancias espectaculares todavía; esto es la base, no el resultado final.

## Dónde está esto ahora mismo

A fecha de este artículo, Python 3.14 (publicado en octubre de 2025) ya movió el free-threading de experimental a **oficialmente soportado** bajo la **PEP 779**, aunque sigue siendo opcional y no es el build por defecto — sigue requiriendo activarlo explícitamente vía un binario `python3.14t`. El JIT sigue siendo experimental en la 3.14, desactivado por defecto, aunque los benchmarks de campo reportan ganancias más notables (aproximadamente entre un 10% y un 30% en código intensivo en cómputo, con bucles y aritmética) que las "modestas" documentadas para la 3.13. Ambas funcionalidades están convergiendo hacia estar listas para producción, pero la 3.13 es donde por primera vez se pudieron descargar y probar de verdad.

## Conclusión: vale la pena experimentar, todavía no apostar por ellas

El JIT y el build free-threaded de Python 3.13 atacan las dos limitaciones más antiguas del intérprete — la velocidad en un solo hilo y la prohibición del GIL sobre el paralelismo real multinúcleo — y ninguna de las dos es un juguete. Ambas están respaldadas por PEPs aceptadas, trabajo de implementación real y una hoja de ruta clara hacia convertirse en el estándar. Pero las dos también vienen con advertencias oficiales explícitas: bugs, una penalización de rendimiento medible en un solo hilo en el build free-threaded, y ganancias del JIT todavía modestas. Si mantienes una librería, este es el momento de empezar a probar la compatibilidad. Si despliegas código en producción, todavía conviene observar desde la barrera un poco más — la 3.14 y las versiones siguientes son donde estas funcionalidades están llamadas a madurar.
