---
title: 'TypeScript 7.0: The Native Go-Based Compiler'
pubDate: 2026-07-10
description: 'TypeScript 7.0 shipped on July 8, 2026, as the first release built on a full native port of the compiler to Go. Here is why Microsoft moved away from JavaScript, what actually got faster, and how to upgrade without breaking your project.'
author: 'Sergio Zabala'
image:
  url: '/typescript.webp'
  alt: 'TypeScript logo.'
tags: ["TypeScript", "JavaScript"]
transitionSlug: 'typescript-7-0-native-go-compiler'
---

## Project Corsa, Explained

TypeScript 7.0 landed on July 8, 2026, and it is not just another yearly release. It is the first version of the compiler built on top of a complete native port to Go, a project Microsoft has been running under the internal codename "Project Corsa" since Anders Hejlsberg first announced it back in March 2025. The team is careful about the wording: this is a **port**, not a rewrite. The Go codebase moved the existing TypeScript compiler ("Strada") structure file by file, keeping the same algorithms, the same data structures, and, critically, the same type-checking semantics. The goal was speed, not a redesign of how TypeScript understands your code.

## Why Go and Not Rust, C#, or More JavaScript

The obvious question is why Go, when Rust is the usual choice for this kind of systems-level rewrite. The TypeScript team evaluated Rust and decided against it: the existing compiler leans heavily on graphs, shared mutable state, and data passed around by reference, patterns that map cleanly onto Go but would have forced a structural redesign in Rust — adding years to the project. Go let the team port the logic close to function-for-function, and its goroutines made it straightforward to parallelize type-checking across CPU cores without rearchitecting the checker. In short: Go was the pragmatic choice that let them preserve correctness while still getting native-code performance and real multithreading.

## The Performance Numbers

Microsoft reports roughly a 10x speedup over TypeScript 6.0 on typical workloads, with a range of 8x to 12x depending on the codebase. Some of the published benchmarks from full builds:

- VS Code: 125.7s → 10.6s (about 11.9x faster)
- Sentry: 139.8s → 15.7s (about 8.9x faster)
- Bluesky: 24.3s → 2.8s (about 8.7x faster)
- Slack's CI type-checking step: 7.5 minutes → 1.25 minutes

Memory usage also dropped, with reductions reported between 6% and 26% depending on the project. These are real build pipelines, not synthetic microbenchmarks, which is why the number is being repeated everywhere.

## What Changes in Your Editor

The speedup is not just about `tsc` on the command line. TSServer, the language service behind autocomplete, inline errors, and go-to-definition, was rebuilt on top of the Language Server Protocol with multi-threaded request handling. Microsoft reports that opening a file with errors in VS Code went from around 17.5 seconds to under 1.3 seconds on large projects — about 13x faster — and that failing language server commands dropped by roughly 80%, with crashes down 60% compared to 6.0. Auto-imports, inlay hints, code lenses, and JSX linked editing, previously missing in early Go-based previews, are now present. The rebuilt `--watch` mode also uses a Go port of Parcel's native file watcher instead of polling, which noticeably cuts idle resource usage.

For fine-tuning parallelism, three new flags are worth knowing: `--checkers` controls how many type-checking workers run (default 4, and pushing it higher trades memory for speed), `--builders` parallelizes project reference builds in monorepos, and `--singleThreaded` disables all of it for debugging or constrained environments.

## Breaking Changes and Migration Caveats

TypeScript 7.0 also resets several defaults and drops long-deprecated features, so this is not a drop-in upgrade for every project:

- `strict` mode is enabled by default.
- `module` now defaults to `esnext`.
- `types` defaults to an empty array — you now have to list the `@types` packages you actually want.
- `rootDir` defaults to `./`, which can shift output paths in existing configs.
- `stableTypeOrdering` is mandatory and can no longer be turned off.
- ES5 targets, AMD/UMD/SystemJS module output, `baseUrl` (use `paths` instead), and classic module resolution are all gone. `esModuleInterop` and `allowSyntheticDefaultImports` can no longer be set to `false`.
- Template literal types now split strings on Unicode code points instead of surrogate pairs, so `"😀abc"` splits as `["😀", "abc"]` rather than breaking the emoji apart.

The bigger practical caveat: there is no stable programmatic API in 7.0 yet — that lands in 7.1. That means tooling built on top of the compiler API, including `typescript-eslint`, and framework-specific tooling for Vue, Svelte, Astro, MDX, and Angular templates, cannot adopt TypeScript 7 yet. If your stack (like this site's) relies on Astro's TypeScript integration, you are not blocked from installing 7.0, but full tooling support is still catching up.

## How to Upgrade Today

Because of that gap, Microsoft is shipping a compatibility package so you can run both compilers side by side while your tooling catches up:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

This lets you point your editor and CI at the fast native compiler for type-checking while keeping the 6.0-compatible package around for any tool that still expects the old programmatic API (exposed as the `tsc6` binary). If your project doesn't depend on framework tooling that hasn't caught up yet, a straightforward `npm install -D typescript@7` is enough — just budget time to work through the new strict defaults and the removed legacy options.

## Conclusion

TypeScript 7.0 is the rare release where the marketing number and the real-world benchmarks actually line up: a native Go compiler that is genuinely faster to build, faster to type-check, and much faster to work with in the editor. The tradeoff is that it arrives with real breaking changes and an ecosystem that has not fully caught up yet. If your project doesn't lean on framework-specific TypeScript tooling, upgrading now is worth it. If it does, the side-by-side compatibility setup buys you time to move at your own pace while still getting the native compiler where it matters most: your day-to-day editor experience.
