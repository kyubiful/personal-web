---
title: 'TypeScript 7.0: el compilador nativo en Go'
pubDate: 2026-07-10
description: 'TypeScript 7.0 salió el 8 de julio de 2026 como la primera versión construida sobre un port nativo del compilador a Go. Por qué Microsoft se alejó de JavaScript, qué mejoró realmente en velocidad y cómo actualizar sin romper tu proyecto.'
author: 'Sergio Zabala'
image:
  url: '/typescript.webp'
  alt: 'TypeScript logo.'
tags: ["TypeScript", "JavaScript"]
transitionSlug: 'typescript-7-0-native-go-compiler'
---

## Project Corsa, explicado

TypeScript 7.0 llegó el 8 de julio de 2026 y no es un lanzamiento anual más. Es la primera versión del compilador construida sobre un port nativo completo a Go, un proyecto que Microsoft lleva desarrollando bajo el nombre en clave "Project Corsa" desde que Anders Hejlsberg lo anunció en marzo de 2025. El equipo insiste en la palabra correcta: esto es un **port**, no una reescritura. El código en Go trasladó la estructura del compilador original ("Strada") archivo por archivo, conservando los mismos algoritmos, las mismas estructuras de datos y, sobre todo, la misma semántica de chequeo de tipos. El objetivo era velocidad, no rediseñar cómo TypeScript entiende tu código.

## Por qué Go y no Rust, C# o más JavaScript

La pregunta obvia es por qué Go, cuando Rust suele ser la opción habitual para este tipo de reescrituras a bajo nivel. El equipo de TypeScript evaluó Rust y lo descartó: el compilador existente depende mucho de grafos, estado mutable compartido y datos que se pasan por referencia, patrones que encajan de forma natural en Go pero que en Rust habrían exigido un rediseño estructural completo, sumando años al proyecto. Go les permitió portar la lógica casi función por función, y sus goroutines facilitaron paralelizar el chequeo de tipos entre núcleos de CPU sin tener que rearquitecturar el checker. En resumen: Go fue la opción pragmática que les permitió preservar la corrección del compilador mientras ganaban rendimiento de código nativo y multithreading real.

## Los números de rendimiento

Microsoft reporta una mejora de aproximadamente 10x frente a TypeScript 6.0 en cargas de trabajo típicas, con un rango de entre 8x y 12x según el proyecto. Algunos de los benchmarks publicados sobre builds completos:

- VS Code: 125.7s → 10.6s (unas 11.9x más rápido)
- Sentry: 139.8s → 15.7s (unas 8.9x más rápido)
- Bluesky: 24.3s → 2.8s (unas 8.7x más rápido)
- El paso de chequeo de tipos en el CI de Slack: 7.5 minutos → 1.25 minutos

El uso de memoria también bajó, con reducciones reportadas de entre un 6% y un 26% según el proyecto. Son pipelines de build reales, no microbenchmarks sintéticos, por eso la cifra se repite tanto en la cobertura del lanzamiento.

## Qué cambia en tu editor

La mejora no es solo cuestión de `tsc` en la terminal. TSServer, el language service detrás del autocompletado, los errores en línea y el "ir a definición", se reconstruyó sobre el Language Server Protocol con manejo de peticiones multihilo. Microsoft reporta que abrir un archivo con errores en VS Code pasó de unos 17.5 segundos a menos de 1.3 segundos en proyectos grandes, alrededor de 13x más rápido, y que los comandos del language server que fallaban bajaron cerca de un 80%, con un 60% menos de caídas respecto a 6.0. Funciones que faltaban en las primeras previews basadas en Go, como auto-imports, inlay hints, code lenses y linked editing en JSX, ya están presentes. El modo `--watch`, también reconstruido, usa un port en Go del file watcher nativo de Parcel en vez de polling, lo que reduce notablemente el consumo de recursos en reposo.

Para ajustar el paralelismo hay tres flags nuevos que vale la pena conocer: `--checkers` controla cuántos workers de chequeo de tipos corren (por defecto 4; subirlo cambia memoria por velocidad), `--builders` paraleliza los builds de project references en monorepos, y `--singleThreaded` desactiva todo el paralelismo para depurar o para entornos con recursos limitados.

## Cambios que rompen compatibilidad y precauciones al migrar

TypeScript 7.0 también cambia varios valores por defecto y elimina funciones deprecadas desde hace tiempo, así que no es una actualización directa para todos los proyectos:

- `strict` viene activado por defecto.
- `module` ahora usa `esnext` como valor por defecto.
- `types` ahora es un array vacío por defecto: hay que listar explícitamente los paquetes `@types` que realmente necesitas.
- `rootDir` pasa a ser `./` por defecto, lo que puede alterar las rutas de salida en configuraciones existentes.
- `stableTypeOrdering` es obligatorio y ya no se puede desactivar.
- Se eliminaron el target ES5, la salida de módulos AMD/UMD/SystemJS, `baseUrl` (ahora hay que usar `paths`) y la resolución de módulos "classic". `esModuleInterop` y `allowSyntheticDefaultImports` ya no pueden ponerse en `false`.
- Los template literal types ahora dividen las cadenas por code points Unicode en vez de por pares suplentes, así que `"😀abc"` se divide como `["😀", "abc"]` en lugar de romper el emoji.

La precaución más importante en la práctica: en 7.0 todavía no hay una API programática estable, eso llega en 7.1. Eso significa que herramientas construidas sobre la API del compilador, incluido `typescript-eslint`, y el tooling específico de frameworks para Vue, Svelte, Astro, MDX y las plantillas de Angular, aún no pueden adoptar TypeScript 7. Si tu stack (como el de este sitio) depende de la integración de TypeScript de Astro, instalar 7.0 no está bloqueado, pero el soporte completo de tooling todavía va detrás.

## Cómo actualizar hoy

Por esa brecha, Microsoft publicó un paquete de compatibilidad para correr los dos compiladores en paralelo mientras el resto del tooling se pone al día:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

Esto te permite apuntar el editor y el CI al compilador nativo rápido para el chequeo de tipos, mientras mantienes el paquete compatible con 6.0 para cualquier herramienta que aún espere la API programática antigua (expuesta como el binario `tsc6`). Si tu proyecto no depende de tooling de framework que todavía no se puso al día, un simple `npm install -D typescript@7` es suficiente, pero conviene reservar tiempo para revisar los nuevos valores estrictos por defecto y las opciones legacy que se eliminaron.

## Conclusión

TypeScript 7.0 es de esos lanzamientos donde el número de marketing y los benchmarks reales coinciden: un compilador nativo en Go que de verdad compila más rápido, chequea tipos más rápido y se siente mucho más ágil en el editor día a día. La contrapartida es que llega con cambios que rompen compatibilidad de verdad y un ecosistema que todavía no terminó de ponerse al día. Si tu proyecto no depende de tooling específico de framework, vale la pena actualizar ya. Si depende, el setup de compatibilidad en paralelo te da margen para migrar a tu ritmo sin renunciar al compilador nativo justo donde más se nota: en tu experiencia diaria con el editor.
