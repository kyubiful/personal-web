---
title: "What's New in TypeScript 5.x"
pubDate: 2025-08-15
description: 'A tour through the TypeScript 5.x release line: standard decorators, the satisfies operator, using declarations for resource management, inferred type predicates, and the other features that quietly reshaped how we write typed JavaScript.'
author: 'Sergio Zabala'
image:
  url: '/typescript.webp'
  alt: 'TypeScript logo.'
tags: ['TypeScript', 'JavaScript']
transitionSlug: 'typescript-5-new-features'
---

The TypeScript 5.x line, from 5.0 through 5.9, has been one of the most productive stretches in the language's history. Instead of one big-bang release, the team shipped a steady sequence of minor versions that each solved a real, everyday pain point. Here is a practical look at the features that matter most, with the code you'd actually write.

## Standard Decorators

TypeScript 5.0 replaced the old experimental decorators with an implementation of the new ECMAScript decorators standard. They no longer require `experimentalDecorators` and behave consistently with how browsers and other tools will eventually run them.

```ts
function logged(target: Function, context: ClassMethodDecoratorContext) {
  return function (this: unknown, ...args: unknown[]) {
    console.log(`Calling ${String(context.name)}`)
    return target.apply(this, args)
  }
}

class Greeter {
  @logged
  greet(name: string) {
    return `Hello, ${name}!`
  }
}
```

## const Type Parameters

Also from 5.0, adding `const` to a generic type parameter tells the compiler to infer the narrowest possible literal type, without forcing callers to sprinkle `as const` everywhere.

```ts
function tuple<const T extends readonly unknown[]>(...items: T): T {
  return items
}

const point = tuple(10, 20) // readonly [10, 20], not number[]
```

## using Declarations for Resource Management

TypeScript 5.2 introduced `using` and `await using`, implementing the Explicit Resource Management proposal. Any object with a `Symbol.dispose` (or `Symbol.asyncDispose`) method is cleaned up automatically when it goes out of scope, no matter how the block exits.

```ts
function readFile(path: string) {
  using handle = openFile(path) // disposed automatically
  return handle.read()
} // handle.close() runs here, even on an early return or throw
```

## NoInfer<T>

Released in 5.4, `NoInfer<T>` lets you tell the compiler to ignore a specific position when inferring a generic type parameter. It's a small utility that fixes a class of confusing generic-function bugs.

```ts
function createStreetLight<T extends string>(
  colors: T[],
  defaultColor?: NoInfer<T>
) {
  // ...
}

createStreetLight(['red', 'yellow', 'green'], 'blue') // error: "blue" is not a known color
```

## Inferred Type Predicates

TypeScript 5.5 made array filtering "just work" for narrowing. A function like `(x) => x !== undefined` used inside `.filter()` is now automatically recognized as a type guard, so you no longer need to annotate it by hand.

```ts
const values = [1, 2, undefined, 4]
const numbers = values.filter((v) => v !== undefined) // number[], not (number | undefined)[]
```

5.5 also added regular expression syntax checking, catching malformed patterns and unsupported features for your target at compile time instead of at runtime.

## Preserved Narrowing in Closures

Also shipped in 5.4: if a `let` variable is only ever assigned once before a closure is created, TypeScript now keeps the narrowed type inside that closure instead of widening it back to the declared type. This removes a whole category of unnecessary type assertions in callbacks and event handlers.

## import defer

TypeScript 5.9 added type-checking support for the `import defer` proposal, which lets you import a module without evaluating it until one of its exports is actually accessed. It's aimed at expensive or platform-specific modules that shouldn't run unless they're needed.

```ts
import defer * as feature from './expensive-feature.js'

if (shouldEnableFeature()) {
  feature.run() // module body only executes here
}
```

5.9 also reworked `tsc --init` to produce a short, opinionated `tsconfig.json` instead of a wall of commented-out options, and shipped an early preview of expandable hovers in editors that support them.

## Other Notable Additions Across the Line

A few more changes that are easy to miss but useful in day-to-day code:

- **Object.groupBy and Map.groupBy** (5.4): typed declarations for the new grouping helpers.
- **New Set methods** (5.5): `union`, `intersection`, `difference`, `symmetricDifference`, and friends.
- **JSDoc `@import`** (5.5): type-only imports in plain JavaScript files, without runtime side effects.
- **`--moduleResolution bundler`** (5.0): a resolution strategy that matches how modern bundlers like Vite and esbuild actually resolve modules.
- **Change-by-copy array methods**: type support for `toSorted`, `toSpliced`, `toReversed`, and `with`.

## Conclusion

No single TypeScript 5.x release feels revolutionary on its own, and that's the point. Decorators, `using`, inferred type predicates, and `NoInfer` all target specific friction points that developers had been working around for years. Taken together, they add up to a language that infers more, requires fewer manual annotations, and gets closer to matching the runtime semantics of modern JavaScript. If you've been pinned to an older 5.x minor version, this is a good moment to upgrade and start using them.
