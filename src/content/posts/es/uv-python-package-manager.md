---
title: 'uv: el gestor de paquetes ultrarrápido que sustituye a pip y Poetry'
pubDate: 2026-08-05
description: 'uv es un gestor de paquetes y proyectos de Python escrito en Rust por Astral, los creadores de Ruff. Descubre por qué puede llegar a ser de 10 a 100 veces más rápido que pip, cómo reemplaza a pip, pip-tools, poetry, pyenv y virtualenv en una sola herramienta, y cómo empezar a usarlo en minutos.'
author: 'Sergio Zabala'
image:
  url: '/python.webp'
  alt: 'Python logo.'
tags: ["Python", "Tooling"]
transitionSlug: 'uv-python-package-manager'
---

## ¿Qué es uv?

[uv](https://docs.astral.sh/uv/) es "un gestor de paquetes y proyectos de Python extremadamente rápido, escrito en Rust", desarrollado por [Astral](https://astral.sh/), el mismo equipo detrás del popular linter Ruff. En lugar de combinar `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv`, `virtualenv` y `twine`, uv busca ser la única herramienta que cubra todo eso: resolución de dependencias, entornos virtuales, creación de proyectos, gestión de versiones de Python, ejecución de scripts e incluso publicación de paquetes.

Si alguna vez has tenido que combinar una instalación de `pyenv`, un lockfile de `poetry` y un paso de compilación de `pip-tools` solo para levantar un proyecto, la propuesta de uv es justamente que no deberías necesitarlo.

## ¿Por qué es tan rápido?

El resolvedor e instalador de uv están escritos en Rust, lo que ya le da ventaja frente a herramientas escritas en Python puro, pero la velocidad no viene solo del lenguaje. Según los propios benchmarks de Astral, uv puede llegar a ser **de 10 a 100 veces más rápido que pip** en instalaciones con caché caliente, gracias a:

- Una caché global y direccionada por contenido, compartida entre todos los proyectos de tu máquina, de forma que un paquete descargado una vez nunca se vuelve a descargar ni a construir para otro proyecto.
- Un alto grado de paralelismo durante la resolución de dependencias y la instalación.
- Uso eficiente de hardlinks/copy-on-write en lugar de copiar archivos en cada entorno virtual.

En la práctica, esto convierte instalaciones de dependencias que antes tardaban decenas de segundos en algo prácticamente instantáneo.

## Una sola herramienta, muchos reemplazos

uv expone grupos de comandos diferenciados en lugar de forzar todo por una única interfaz:

- **Proyectos**: gestión de dependencias y entornos a través de `pyproject.toml` y un lockfile universal (`uv.lock`), sustituyendo el flujo de trabajo típico de Poetry.
- **Scripts**: ejecución de scripts independientes con dependencias declaradas de forma inline, siguiendo PEP 723, sin necesidad de configurar un proyecto.
- **Herramientas**: instalación y ejecución de aplicaciones de línea de comandos en entornos aislados, sustituyendo a `pipx`.
- **Versiones de Python**: descarga y gestión de múltiples intérpretes de Python, sustituyendo a `pyenv`.
- **Interfaz de pip**: un conjunto de comandos compatible con pip (`uv pip install`, `uv pip compile`, `uv pip freeze`) para flujos de trabajo heredados que todavía no están listos para migrar a los comandos de alto nivel.

## Primeros pasos

### 1. Instalar uv

En macOS/Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

En Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

También se puede instalar con `pip install uv` o `pipx install uv` si prefieres gestionarlo desde un toolchain de Python ya existente. Una vez instalado, puedes mantenerlo actualizado con:

```bash
uv self update
```

### 2. Crear un proyecto nuevo

```bash
uv init hello-world
cd hello-world
```

Esto genera un `pyproject.toml`, un archivo `.python-version`, un `README.md`, un módulo `src/hello_world/__init__.py` e incluso inicializa un repositorio de git automáticamente.

### 3. Añadir dependencias

```bash
uv add requests
uv add 'requests==2.31.0'
uv add git+https://github.com/psf/requests
```

La primera llamada a `uv add`, `uv run` o `uv sync` crea automáticamente un entorno virtual `.venv/` y genera un lockfile multiplataforma `uv.lock`, sin necesidad de un paso separado de `python -m venv`.

### 4. Ejecutar tu código

```bash
uv run hello-world
```

`uv run` resuelve el entorno al vuelo, así que casi nunca necesitas activar manualmente el entorno virtual. Si prefieres el flujo tradicional, también puedes hacer:

```bash
uv sync
source .venv/bin/activate
```

### 5. Ejecutar un script independiente

uv también resulta muy útil para scripts sueltos que no pertenecen a un proyecto completo. Puedes declarar las dependencias de forma inline (siguiendo PEP 723) y dejar que uv gestione un entorno efímero por ti:

```bash
uv init --script ejemplo.py --python 3.12
uv add --script ejemplo.py 'requests<3' 'rich'
uv run ejemplo.py
```

Esto escribe un pequeño bloque de metadatos al inicio de `ejemplo.py`:

```python
# /// script
# dependencies = [
#   "requests<3",
#   "rich",
# ]
# ///
```

A partir de ahí, `uv run ejemplo.py` siempre resolverá e instalará exactamente esas dependencias en un entorno aislado, en cualquier máquina, sin necesidad de un `requirements.txt` ni de un directorio de proyecto.

### 6. Gestionar versiones de Python y herramientas

```bash
uv python install 3.12
uv python pin 3.12
uv tool install ruff
uvx ruff check .
```

`uv python install` sustituye a `pyenv` para descargar intérpretes, y `uvx` (un alias de `uv tool run`) sustituye a `pipx run` para ejecutar una herramienta de línea de comandos en un entorno desechable sin ensuciar tu proyecto.

## Conclusión: un valor por defecto más simple y rápido

uv no se limita a acelerar `pip install`: colapsa un toolchain fragmentado formado por `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv` y `virtualenv` en un único binario, cohesionado y potenciado por Rust. Para proyectos nuevos se está convirtiendo en una opción por defecto sensata; para los existentes, su interfaz compatible con pip permite una migración progresiva en lugar de un cambio radical. Si tu flujo de trabajo con Python sigue sintiéndose más lento de lo que debería, uv merece los diez minutos que cuesta probarlo.
