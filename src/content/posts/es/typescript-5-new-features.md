---
title: "Las Novedades de TypeScript 5.x"
pubDate: 2025-08-15
description: 'Un recorrido por la serie de versiones TypeScript 5.x: decoradores estándar, el operador satisfies, las declaraciones using para gestión de recursos, predicados de tipo inferidos y el resto de funciones que cambiaron silenciosamente cómo escribimos JavaScript tipado.'
author: 'Sergio Zabala'
image:
  url: '/typescript.webp'
  alt: 'TypeScript logo.'
tags: ["TypeScript", "JavaScript"]
transitionSlug: 'typescript-5-new-features'
---

La serie TypeScript 5.x, desde la 5.0 hasta la 5.9, ha sido uno de los tramos más productivos en la historia del lenguaje. En lugar de una gran versión disruptiva, el equipo fue publicando versiones menores de forma constante, cada una resolviendo un problema real del día a día. Este es un repaso práctico de las funciones más relevantes, con el código que realmente usarías.

## Decoradores Estándar

TypeScript 5.0 sustituyó los antiguos decoradores experimentales por una implementación del nuevo estándar de decoradores de ECMAScript. Ya no requieren activar `experimentalDecorators` y se comportan de forma coherente con cómo los navegadores y otras herramientas los ejecutarán en el futuro.

```ts
function logged(target: Function, context: ClassMethodDecoratorContext) {
  return function (this: unknown, ...args: unknown[]) {
    console.log(`Llamando a ${String(context.name)}`);
    return target.apply(this, args);
  };
}

class Greeter {
  @logged
  greet(name: string) {
    return `Hola, ${name}!`;
  }
}
```

## Parámetros de Tipo const

También desde la 5.0, añadir `const` a un parámetro de tipo genérico le indica al compilador que infiera el tipo literal más estrecho posible, sin obligar a quien llama la función a añadir `as const` por todas partes.

```ts
function tuple<const T extends readonly unknown[]>(...items: T): T {
  return items;
}

const point = tuple(10, 20); // readonly [10, 20], no number[]
```

## Declaraciones using para Gestión de Recursos

TypeScript 5.2 introdujo `using` y `await using`, implementando la propuesta de Explicit Resource Management. Cualquier objeto con un método `Symbol.dispose` (o `Symbol.asyncDispose`) se limpia automáticamente al salir de su ámbito, sin importar cómo termine el bloque.

```ts
function readFile(path: string) {
  using handle = openFile(path); // se libera automáticamente
  return handle.read();
} // handle.close() se ejecuta aquí, incluso con un return anticipado o un throw
```

## NoInfer<T>

Publicado en la 5.4, `NoInfer<T>` permite indicarle al compilador que ignore una posición concreta al inferir un parámetro de tipo genérico. Es una utilidad pequeña que resuelve una categoría entera de errores confusos en funciones genéricas.

```ts
function createStreetLight<T extends string>(
  colors: T[],
  defaultColor?: NoInfer<T>
) {
  // ...
}

createStreetLight(["red", "yellow", "green"], "blue"); // error: "blue" no es un color conocido
```

## Predicados de Tipo Inferidos

TypeScript 5.5 hizo que el filtrado de arrays "simplemente funcionara" para el estrechamiento de tipos. Una función como `(x) => x !== undefined` usada dentro de `.filter()` ahora se reconoce automáticamente como un type guard, así que ya no hace falta anotarla a mano.

```ts
const values = [1, 2, undefined, 4];
const numbers = values.filter((v) => v !== undefined); // number[], no (number | undefined)[]
```

La 5.5 también añadió comprobación de sintaxis en expresiones regulares, detectando patrones mal formados o funciones no soportadas para el target de compilación en tiempo de compilación en lugar de en tiempo de ejecución.

## Estrechamiento Preservado en Closures

También llegó en la 5.4: si una variable `let` solo se asigna una vez antes de crear un closure, TypeScript ahora mantiene el tipo estrechado dentro de ese closure en lugar de ampliarlo de nuevo al tipo declarado. Esto elimina toda una categoría de aserciones de tipo innecesarias en callbacks y manejadores de eventos.

## import defer

TypeScript 5.9 añadió soporte de tipado para la propuesta `import defer`, que permite importar un módulo sin evaluarlo hasta que se accede realmente a una de sus exportaciones. Está pensado para módulos costosos o específicos de plataforma que no deberían ejecutarse a menos que sean necesarios.

```ts
import defer * as feature from "./expensive-feature.js";

if (shouldEnableFeature()) {
  feature.run(); // el cuerpo del módulo solo se ejecuta aquí
}
```

La 5.9 también rediseñó `tsc --init` para generar un `tsconfig.json` corto y con opiniones claras, en lugar de una pared de opciones comentadas, y publicó una vista previa temprana de hovers expandibles en los editores compatibles.

## Otras Adiciones Notables en la Serie

Algunos cambios más, fáciles de pasar por alto pero útiles en el código del día a día:

- **Object.groupBy y Map.groupBy** (5.4): declaraciones tipadas para las nuevas funciones de agrupación.
- **Nuevos métodos de Set** (5.5): `union`, `intersection`, `difference`, `symmetricDifference` y similares.
- **JSDoc `@import`** (5.5): importaciones solo de tipo en archivos JavaScript planos, sin efectos secundarios en tiempo de ejecución.
- **`--moduleResolution bundler`** (5.0): una estrategia de resolución que coincide con cómo resuelven módulos realmente los bundlers modernos como Vite y esbuild.
- **Métodos de array por copia**: soporte de tipos para `toSorted`, `toSpliced`, `toReversed` y `with`.

## Conclusión

Ninguna versión de la serie TypeScript 5.x parece revolucionaria por sí sola, y ese es precisamente el punto. Los decoradores, `using`, los predicados de tipo inferidos y `NoInfer` atacan puntos de fricción concretos con los que el equipo de desarrolladores llevaba años lidiando. En conjunto, suman un lenguaje que infiere más, exige menos anotaciones manuales y se acerca cada vez más a la semántica real del JavaScript moderno en tiempo de ejecución. Si te has quedado en una versión menor anterior de la 5.x, este es un buen momento para actualizar y empezar a usarlas.
