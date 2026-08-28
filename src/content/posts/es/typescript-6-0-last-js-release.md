---
title: 'TypeScript 6.0: la última versión basada en JavaScript'
pubDate: 2026-03-25
description: 'TypeScript 6.0 salió el 23 de marzo de 2026 como la última versión del compilador construido sobre el código base original en JavaScript. Repasamos qué cambió, qué se dejó de usar y por qué Microsoft la presenta como un puente hacia TypeScript 7.0, escrito en Go.'
author: 'Sergio Zabala'
image:
  url: '/typescript.webp'
  alt: 'TypeScript logo.'
tags: ['TypeScript', 'JavaScript']
transitionSlug: 'typescript-6-0-last-js-release'
---

## El fin de una era

El 23 de marzo de 2026, el equipo de TypeScript publicó la versión 6.0 y con ella cerró un capítulo que empezó cuando el compilador se escribió por primera vez en JavaScript. Según el anuncio oficial en el devblog de TypeScript, la 6.0 es explícitamente "la última versión basada en el código base actual de JavaScript". A partir de aquí, empezando por TypeScript 7.0, todo correrá sobre un compilador reescrito en Go, pensado para aprovechar la velocidad del código nativo y el multi-threading con memoria compartida.

Ese enfoque importa más que cualquier funcionalidad puntual de esta versión. TypeScript 6.0 no es simplemente la actualización anual de turno: es un puente deliberado, y el propio equipo lo dice así: "la mayoría de los cambios en TypeScript 6.0 buscan alinear y preparar la adopción de TypeScript 7.0".

## Nuevas funcionalidades del lenguaje

**Soporte para la API Temporal.** La propuesta Stage 4 de `Temporal` ya forma parte de los tipos integrados de TypeScript cuando el target es `esnext`:

```ts
const ayer = Temporal.Now.instant().subtract({ hours: 24 })
```

**ES2025 como target y como lib.** Ahora se puede configurar `"target": "es2025"` o añadir `"es2025"` a `lib`, lo que incorpora `RegExp.escape()`, `Promise.try()`, nuevos métodos de iteradores y métodos adicionales de `Set`.

**Métodos "upsert" en Map/WeakMap**, disponibles a través de la lib `esnext`:

```ts
const cache = new Map<string, number>()
cache.getOrInsert('aciertos', 0)
cache.getOrInsertComputed('fallos', () => calcularValorPorDefecto())
```

**Subpath imports que empiezan con `#/`.** Combinado con la resolución `nodenext` o `bundler`, ahora se pueden crear alias de rutas sin segmentos adicionales:

```json
{ "imports": { "#/*": "./dist/*" } }
```

## Mejoras en el checker

La inferencia sobre métodos que no usan `this` es ahora más inteligente: TypeScript prioriza esas funciones durante la inferencia de tipos, lo que corrige casos donde los parámetros de tipo genéricos no se resolvían al reordenar las propiedades de un objeto (una mejora aportada por Mateusz Burzyński).

También se suma un nuevo flag, `--stableTypeOrdering`, que alinea el orden de tipos de la 6.0 con el algoritmo determinista que usará TypeScript 7.0 para el chequeo de tipos en paralelo. Puede suponer hasta un 25% de ralentización, así que está pensado como diagnóstico de migración, no como algo que se deje activado de forma permanente.

La librería `dom` también se consolidó: `dom.iterable` y `dom.asynciterable` quedan incluidas por defecto, así que `for (const el of document.querySelectorAll("div"))` funciona sin configuración extra.

## Deprecaciones y cambios que rompen compatibilidad

Aquí es donde el enfoque de "puente" se vuelve concreto. Varios valores por defecto cambiaron:

- `strict: true` (antes era `false`)
- `module: "esnext"` (antes era `"commonjs"`)
- `target` ahora sigue el año actual de la especificación ES (hoy `es2025`)
- `types: []` por defecto, en lugar de detectar automáticamente todo lo que hay bajo `@types`
- `noUncheckedSideEffectImports: true`, `libReplacement: false`
- `rootDir` ahora toma por defecto el directorio donde está el `tsconfig.json`

Y una larga lista de opciones heredadas quedó deprecada o eliminada directamente: `target: es5` (ES2015 pasa a ser el mínimo soportado), `--downlevelIteration`, `--moduleResolution node` (node10, a favor de `nodenext`/`bundler`), `--module amd|umd|systemjs|none`, `--baseUrl` (hay que incorporar el prefijo directamente en `paths`), `--moduleResolution classic`, `--esModuleInterop false`, `--allowSyntheticDefaultImports false`, `--alwaysStrict false`, `--outFile`, la palabra clave `module` heredada para namespaces (se usa `namespace`), la palabra clave `asserts` en imports (se usa `with`) y la directiva triple-slash `no-default-lib`.

Además, pasar archivos por línea de comandos junto con un `tsconfig.json` existente ahora produce error por defecto, salvo que se use `--ignoreConfig`.

Cada uno de estos cambios elimina un patrón que el futuro compilador nativo en Go, o no va a soportar, o quiere estandarizar antes de llegar.

## Conclusión: una evolución necesaria

TypeScript 6.0 no persigue sintaxis vistosa: está ordenando la casa. Valores por defecto más estrictos, opciones heredadas eliminadas y un flag de diagnóstico para el futuro algoritmo de ordenación del checker apuntan todos en la misma dirección: dejar el ecosistema listo para un compilador que, según el propio equipo de TypeScript, está "extremadamente cerca de completarse" y que ya se puede probar mediante el paquete `@typescript/native-preview`. Si tu proyecto todavía depende de módulos `commonjs`, de un `strict` relajado o de la resolución `node10`, la 6.0 es la señal para migrar ahora, mientras la transición sigue siendo gradual, porque la 7.0 no va a arrastrar ese peso.
