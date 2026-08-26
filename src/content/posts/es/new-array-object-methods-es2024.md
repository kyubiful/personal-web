---
title: 'Nuevos métodos de Array y Object en el JavaScript moderno (ES2024+)'
pubDate: 2026-07-20
description: 'Un recorrido práctico por los métodos nativos que llegaron recientemente a los motores de JavaScript: Object.groupBy, Map.groupBy, Promise.withResolvers, Array.fromAsync y los nuevos métodos de composición de Set. Se acabaron los malabares con reduce() y los polyfills manuales.'
author: 'Sergio Zabala'
image:
  url: '/javascript.webp'
  alt: 'JavaScript logo.'
tags: ['JavaScript', 'ECMAScript']
transitionSlug: 'new-array-object-methods-es2024'
---

Durante años, agrupar un array o combinar dos objetos `Set` significaba tirar de Lodash o repetir una y otra vez el mismo `reduce()` de siempre. Eso ya no hace falta. Varias propuestas de TC39 llegaron a Stage 4 y se implementaron en los motores durante 2024, y hoy son perfectamente seguras de usar en cualquier entorno mínimamente actualizado. Vamos a repasarlas.

## Agrupar datos: Object.groupBy() y Map.groupBy()

`Object.groupBy()` recibe un iterable y una función callback, y devuelve un objeto sin prototipo cuyas claves son los nombres de los grupos:

```javascript
const inventario = [
  { nombre: 'espárragos', tipo: 'verdura', cantidad: 5 },
  { nombre: 'plátanos', tipo: 'fruta', cantidad: 0 },
  { nombre: 'cabra', tipo: 'carne', cantidad: 23 }
]

const porTipo = Object.groupBy(inventario, ({ tipo }) => tipo)
// {
//   verdura: [{ nombre: 'espárragos', ... }],
//   fruta: [{ nombre: 'plátanos', ... }],
//   carne: [{ nombre: 'cabra', ... }]
// }
```

Si la clave de agrupación necesita ser algo distinto a un string (por ejemplo, la referencia a un objeto), usa `Map.groupBy()` en su lugar. Funciona igual, pero devuelve un `Map` real, así que las claves pueden ser cualquier valor sin necesidad de convertirlas a texto:

```javascript
const reponer = { reponer: true }
const suficiente = { reponer: false }

const porStock = Map.groupBy(inventario, ({ cantidad }) =>
  cantidad < 6 ? reponer : suficiente
)

porStock.get(reponer)
// [{ nombre: 'plátanos', tipo: 'fruta', cantidad: 0 }]
```

Ambos métodos son Baseline "recién disponibles" desde marzo de 2024 y ya funcionan de forma nativa en todos los navegadores principales y en Node.js.

## Resolver promesas desde fuera: Promise.withResolvers()

¿Alguna vez necesitaste exponer las funciones `resolve`/`reject` de una promesa fuera del callback ejecutor? Antes de `Promise.withResolvers()`, eso implicaba declarar `let resolve` y `let reject` antes de llamar a `new Promise(...)`. Ahora basta con una sola llamada:

```javascript
const { promise, resolve, reject } = Promise.withResolvers()

boton.addEventListener('click', () => resolve('¡clic!'))

promise.then((valor) => console.log(valor))
```

Esto es especialmente útil en streams, colas orientadas a eventos y en general cualquier código que necesite tender un puente entre APIs basadas en callbacks y promesas. Llegó a Node.js 21.7 (y por defecto desde la 22) y a todos los navegadores principales a comienzos de 2024.

## Construir arrays desde fuentes asíncronas: Array.fromAsync()

`Array.fromAsync()` funciona como `Array.from()`, pero entiende iterables asíncronos y espera cualquier promesa que encuentre, devolviendo a su vez una promesa que se resuelve con el array final:

```javascript
async function* rango(inicio, fin, retrasoMs) {
  for (let i = inicio; i <= fin; i++) {
    await new Promise((resolve) => setTimeout(resolve, retrasoMs))
    yield i
  }
}

const valores = await Array.fromAsync(rango(0, 4, 10))
// [0, 1, 2, 3, 4]
```

También funciona con iterables normales que contienen promesas, esperando cada una de ellas:

```javascript
await Array.fromAsync([Promise.resolve(1), Promise.resolve(2)])
// [1, 2]
```

Nada de bucles `for await...of` solo para acumular resultados en un array. `Array.fromAsync()` está ampliamente disponible desde enero de 2024.

## Matemática de conjuntos de verdad: union(), intersection(), difference() y compañía

`Set` por fin obtuvo los métodos de composición que ya tenían los tipos de conjunto de casi cualquier otro lenguaje. Desde junio de 2024, toda instancia de `Set` expone `union()`, `intersection()`, `difference()`, `symmetricDifference()`, `isSubsetOf()`, `isSupersetOf()` e `isDisjointFrom()`:

```javascript
const pares = new Set([2, 4, 6, 8])
const cuadrados = new Set([1, 4, 9])

pares.union(cuadrados)
// Set(6) { 2, 4, 6, 8, 1, 9 }

pares.intersection(cuadrados)
// Set(1) { 4 }

pares.difference(cuadrados)
// Set(3) { 2, 6, 8 }

pares.isDisjointFrom(new Set([1, 3, 5]))
// true
```

Se acabó convertir a array, filtrar y volver a convertir. Además, cada método acepta cualquier objeto "tipo conjunto", no solo instancias de `Set`, lo que simplifica bastante la interoperabilidad.

## Conclusión

`Object.groupBy()`, `Map.groupBy()`, `Promise.withResolvers()`, `Array.fromAsync()` y los nuevos métodos de `Set` alcanzaron Baseline durante 2024 y hoy son seguros de usar en cualquier navegador moderno o runtime de Node.js. Ninguno es revolucionario por separado, pero juntos cierran carencias que llevaban años justificando la instalación de una librería de utilidades. La plataforma sigue absorbiendo los patrones que más usamos los desarrolladores, y ese tipo de progreso "aburrido" merece toda nuestra atención.
