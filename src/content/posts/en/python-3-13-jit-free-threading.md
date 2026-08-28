---
title: 'Python 3.13: The Experimental JIT and Free-Threaded (No-GIL) Mode'
pubDate: 2026-07-28
description: "Python 3.13 shipped two experimental, opt-in features that attack the interpreter's two oldest performance limits at once: a copy-and-patch JIT compiler and a free-threaded build that can disable the GIL. Here's what each one actually does, how to try them today, and where they still bite."
author: 'Sergio Zabala'
image:
  url: '/python.webp'
  alt: 'Python logo.'
tags: ['Python']
transitionSlug: 'python-3-13-jit-free-threading'
---

## Two Experiments, One Release

Python 3.13 (released October 2024) is the first CPython version to ship both a just-in-time compiler and a build that can run without the Global Interpreter Lock. Neither is on by default, and neither is meant for production yet: the core team is explicit about that. But both target real, long-standing pain points: single-threaded execution speed and the inability to use threads for CPU-bound parallelism. Let's look at what each one solves and how to actually try them.

## The Problem: Two Different Kinds of Slow

CPython has historically been slow in two unrelated ways:

- **Per-instruction overhead.** Even with the specializing adaptive interpreter introduced in 3.11, CPython still dispatches and decodes bytecode instructions one at a time, which caps how fast a single thread can run.
- **The GIL.** The Global Interpreter Lock allows only one thread to execute Python bytecode at a time, no matter how many CPU cores are available. Multi-core parallelism has always required separate processes (`multiprocessing`) instead of threads, which brings its own overhead in serialization and IPC.

Python 3.13 introduces one experimental answer to each.

## Free-Threaded CPython (No-GIL)

This feature comes from **PEP 703** ("Making the Global Interpreter Lock Optional in CPython"), accepted by the Steering Council in October 2023. It adds a build configuration that removes the GIL, so multiple threads can genuinely run Python bytecode in parallel on separate cores.

The motivation is concrete: libraries doing scientific computing, ML data loading, and GPU orchestration have long needed multiprocessing workarounds just to sidestep the GIL, which complicates APIs and adds coordination overhead. Free-threading is aimed squarely at that gap.

Under the hood, PEP 703 relies on biased reference counting (fast non-atomic refcounting for the common single-threaded case), immortalizing frequently shared objects like `None`, `True`, and small integers, and per-object locks instead of one global lock.

### How to try it

Free-threaded mode requires a separate executable, usually `python3.13t` (or `python3.13t.exe` on Windows). You can get it via:

- The official Windows and macOS installers, which offer a free-threaded option.
- Building CPython from source with `--disable-gil`.

To confirm you're actually running without the GIL:

```bash
python3.13t -VV
# look for "experimental free-threading build" in the version string
```

```python
import sys
sys._is_gil_enabled()  # False if the GIL is genuinely off
```

You can still force the GIL back on at runtime with `PYTHON_GIL=1` or `-X gil=1`: useful if a C extension you depend on isn't thread-safe yet.

### The caveats

- **This is experimental.** Expect bugs and, notably, a real single-threaded performance hit compared to the standard build.
- **C extensions need explicit support.** Extension modules must be built specifically for the free-threaded build and opt in via the `Py_mod_gil` slot. Importing an extension that doesn't will silently re-enable the GIL for the whole process.
- **Tooling.** You need pip 24.1 or newer to install packages with C extensions on the free-threaded build.

## The Experimental JIT Compiler

This comes from **PEP 744** ("JIT Compilation"). Instead of adopting a heavyweight framework like LLVM at runtime, CPython uses a technique called **copy-and-patch**: machine-code templates are generated at build time from the same DSL that defines CPython's bytecode instructions, then customized with runtime values and stitched together during execution. The only build-time dependency is LLVM; there's no runtime dependency at all.

Architecturally, hot Tier 1 bytecode gets translated into an internal Tier 2 IR (micro-ops, or "uops"), which goes through optimization passes and can then be translated to native machine code by the JIT, instead of being dispatched instruction-by-instruction.

This builds directly on the specializing adaptive interpreter from 3.11 and the Tier 2 micro-op interpreter also introduced in 3.13: the JIT is the next step after those, aimed at removing the remaining dispatch and decoding overhead.

### How to try it

The JIT isn't in official pre-built binaries for 3.13; you need to build CPython yourself with:

```bash
./configure --enable-experimental-jit
```

Useful variants:

- `--enable-experimental-jit=yes-off`: builds the JIT but disables it by default; enable at runtime with `PYTHON_JIT=1`.
- `--enable-experimental-jit=interpreter`: enables just the Tier 2 interpreter (useful for debugging), without the JIT itself.

On Windows, the equivalent is `PCbuild/build.bat --experimental-jit`.

### The caveats

The official line from the CPython docs is blunt: **performance improvements are modest** in 3.13: the team expects this to improve over the next few releases. Don't expect dramatic wins yet; this is the foundation, not the payoff.

## Where This Stands Today

As of this writing, Python 3.14 (released October 2025) has moved free-threading from experimental to **officially supported** under **PEP 779**, though it's still optional and not the default build: you still opt in via a `python3.14t` binary. The JIT remains experimental in 3.14, still off by default, though field benchmarks report more noticeable gains (roughly 10–30% on compute-heavy, loop-and-arithmetic-style code) than the "modest" improvements documented for 3.13. Both features are converging toward production readiness, but 3.13 is where they first became something you could actually download and try.

## Conclusion: Worth Experimenting, Not Yet Worth Betting On

Python 3.13's JIT and free-threaded build attack the interpreter's two oldest limitations — single-threaded speed and the GIL's ban on true multi-core parallelism — and neither one is a toy. Both are grounded in accepted PEPs, real implementation work, and a clear roadmap toward becoming standard. But both also come with explicit, official warnings: bugs, a measurable single-threaded performance regression on the free-threaded build, and only modest JIT gains for now. If you maintain a library, this is the moment to start testing compatibility. If you ship production code, it's still worth watching from the sidelines a little longer: 3.14 and beyond are where these features are meant to mature.
