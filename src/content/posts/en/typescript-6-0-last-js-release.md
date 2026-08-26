---
title: 'TypeScript 6.0: The Last JavaScript-Based Release'
pubDate: 2026-03-25
description: 'TypeScript 6.0 shipped on March 23, 2026 as the final version of the compiler built on the original JavaScript codebase. Here is what changed, what got deprecated, and why Microsoft calls it a bridge toward the Go-native TypeScript 7.0.'
author: 'Sergio Zabala'
image:
  url: '/typescript.webp'
  alt: 'TypeScript logo.'
tags: ["TypeScript", "JavaScript"]
transitionSlug: 'typescript-6-0-last-js-release'
---

## The End of an Era

On March 23, 2026, the TypeScript team shipped version 6.0, and with it closed a chapter that started back when the compiler was first written in JavaScript. According to the official announcement on the TypeScript devblog, 6.0 is explicitly "the last release based on the current JavaScript codebase." Everything from here on, starting with TypeScript 7.0, will run on a compiler rewritten in Go, built to take advantage of native code speed and shared-memory multi-threading.

That framing matters more than any single feature in this release. TypeScript 6.0 isn't just another yearly update — it's a deliberate bridge, and the team says as much: "most changes in TypeScript 6.0 are meant to help align and prepare for adopting TypeScript 7.0."

## New Language Features

**Temporal API support.** The Stage 4 `Temporal` proposal is now part of TypeScript's built-in types when you target `esnext`:

```ts
const yesterday = Temporal.Now.instant().subtract({ hours: 24 });
```

**ES2025 as a target and lib option.** You can now set `"target": "es2025"` or add `"es2025"` to `lib`, which brings in `RegExp.escape()`, `Promise.try()`, new iterator helpers, and additional `Set` methods.

**Map/WeakMap "upsert" methods**, available via the `esnext` lib:

```ts
const cache = new Map<string, number>();
cache.getOrInsert("hits", 0);
cache.getOrInsertComputed("misses", () => expensiveDefault());
```

**Subpath imports starting with `#/`.** Combined with `nodenext` or `bundler` resolution, you can now alias without extra path segments:

```json
{ "imports": { "#/*": "./dist/*" } }
```

## Checker Improvements

Inference around methods that don't reference `this` got smarter — TypeScript now prioritizes those functions during type inference, fixing cases where generic type parameters failed to resolve when object properties were reordered (a fix contributed by Mateusz Burzyński).

There's also a new `--stableTypeOrdering` flag. It aligns 6.0's type ordering with the deterministic algorithm TypeScript 7.0 will use for parallel type checking. It can cost up to a 25% slowdown, so it's meant as a migration diagnostic, not something you leave on permanently.

The `dom` library was also consolidated: `dom.iterable` and `dom.asynciterable` are folded in by default, so `for (const el of document.querySelectorAll("div"))` just works without extra config.

## Deprecations and Breaking Changes

This is where the "bridge" framing becomes concrete. Several defaults changed:

- `strict: true` (was `false`)
- `module: "esnext"` (was `"commonjs"`)
- `target` now floats to the current-year ES version — `es2025` today
- `types: []` by default, instead of auto-discovering everything under `@types`
- `noUncheckedSideEffectImports: true`, `libReplacement: false`
- `rootDir` now defaults to the tsconfig.json directory

And a long list of legacy options got deprecated or removed outright: `target: es5` (ES2015 is now the floor), `--downlevelIteration`, `--moduleResolution node` (node10, in favor of `nodenext`/`bundler`), `--module amd|umd|systemjs|none`, `--baseUrl` (fold the prefix into `paths` instead), `--moduleResolution classic`, `--esModuleInterop false`, `--allowSyntheticDefaultImports false`, `--alwaysStrict false`, `--outFile`, the legacy `module` keyword for namespaces (use `namespace`), the `asserts` keyword on imports (use `with`), and the `no-default-lib` triple-slash directive.

Command-line file arguments alongside an existing `tsconfig.json` now error by default too, unless you pass `--ignoreConfig`.

Every one of these removes a pattern the native Go compiler either won't support or wants to standardize away before it lands.

## Conclusion: A Necessary Evolution

TypeScript 6.0 isn't chasing flashy new syntax — it's cleaning house. Stricter defaults, dropped legacy options, and a diagnostic flag for the checker's future ordering algorithm all point the same direction: getting the ecosystem ready for a compiler that, according to the TypeScript team, is "extremely close to completion" and already previewable through the `@typescript/native-preview` package. If your project still leans on `commonjs` modules, loose `strict` settings, or `node10` resolution, 6.0 is your cue to migrate now, while the transition is still gradual — because 7.0 won't be carrying that baggage forward.
