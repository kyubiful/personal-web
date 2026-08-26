---
title: 'uv: The Ultra-Fast Python Package Manager Replacing pip and Poetry'
pubDate: 2026-08-05
description: 'uv is a Rust-based Python package and project manager from Astral, the makers of Ruff. Discover why it can be 10-100x faster than pip, how it replaces pip, pip-tools, poetry, pyenv, and virtualenv in a single tool, and how to get started with it in minutes.'
author: 'Sergio Zabala'
image:
  url: '/python.webp'
  alt: 'Python logo.'
tags: ['Python', 'Tooling']
transitionSlug: 'uv-python-package-manager'
---

## What Is uv?

[uv](https://docs.astral.sh/uv/) is "an extremely fast Python package and project manager, written in Rust," built by [Astral](https://astral.sh/), the same team behind the popular Ruff linter. Instead of stitching together `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv`, `virtualenv`, and `twine`, uv aims to be the single tool that covers all of it: dependency resolution, virtual environments, project scaffolding, Python version management, script execution, and even publishing.

If you've ever juggled a `pyenv` install, a `poetry` lockfile, and a `pip-tools` compile step just to get a project running, uv's whole pitch is that you shouldn't have to.

## Why Is It So Fast?

uv's core resolver and installer are written in Rust, which already gives it an edge over pure-Python tools, but the speed gains come from more than just the language choice. According to Astral's own benchmarks, uv can be **10-100x faster than pip** on warm-cache installs, thanks to:

- A global, content-addressed cache shared across every project on your machine, so a package downloaded once is never re-downloaded or re-built for a different project.
- Aggressive parallelism during dependency resolution and installation.
- Efficient use of hardlinks/copy-on-write instead of copying files into every virtual environment.

In practice, this turns dependency installs that used to take tens of seconds into something closer to instantaneous.

## One Tool, Many Replacements

uv exposes distinct command groups instead of forcing everything through a single interface:

- **Projects** — dependency and environment management via `pyproject.toml` and a universal lockfile (`uv.lock`), replacing Poetry-style workflows.
- **Scripts** — running standalone scripts with inline, PEP 723-style dependency declarations, no project setup required.
- **Tools** — installing and running CLI applications in isolated environments, replacing `pipx`.
- **Python versions** — downloading and managing multiple Python interpreters, replacing `pyenv`.
- **pip interface** — a drop-in, pip-compatible command set (`uv pip install`, `uv pip compile`, `uv pip freeze`) for legacy workflows that aren't ready for the higher-level project commands yet.

## Quick Start

### 1. Install uv

On macOS/Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

On Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

It's also installable via `pip install uv` or `pipx install uv` if you'd rather manage it through an existing Python toolchain. Once installed, keep it up to date with:

```bash
uv self update
```

### 2. Create a New Project

```bash
uv init hello-world
cd hello-world
```

This scaffolds a `pyproject.toml`, a `.python-version` file, a `README.md`, a `src/hello_world/__init__.py` module, and even initializes a git repository for you.

### 3. Add Dependencies

```bash
uv add requests
uv add 'requests==2.31.0'
uv add git+https://github.com/psf/requests
```

The first `uv add`, `uv run`, or `uv sync` call automatically creates a `.venv/` virtual environment and generates a `uv.lock` cross-platform lockfile — no separate `python -m venv` step needed.

### 4. Run Your Code

```bash
uv run hello-world
```

`uv run` resolves the environment on the fly, so you rarely need to manually activate the virtual environment. If you prefer the traditional flow, you can still do:

```bash
uv sync
source .venv/bin/activate
```

### 5. Run a Standalone Script

uv also shines for one-off scripts that don't belong to a full project. You can declare dependencies inline (following PEP 723) and let uv manage an ephemeral environment for you:

```bash
uv init --script example.py --python 3.12
uv add --script example.py 'requests<3' 'rich'
uv run example.py
```

This writes a small metadata block at the top of `example.py`:

```python
# /// script
# dependencies = [
#   "requests<3",
#   "rich",
# ]
# ///
```

From then on, `uv run example.py` will always resolve and install exactly those dependencies in an isolated environment, on any machine, without a `requirements.txt` or a project directory in sight.

### 6. Manage Python Versions and Tools

```bash
uv python install 3.12
uv python pin 3.12
uv tool install ruff
uvx ruff check .
```

`uv python install` replaces `pyenv` for downloading interpreters, and `uvx` (an alias for `uv tool run`) replaces `pipx run` for executing a CLI tool in a throwaway environment without polluting your project.

## Conclusion: A Simpler, Faster Default

uv doesn't just speed up `pip install` — it collapses a fragmented toolchain of `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv`, and `virtualenv` into a single, cohesive, Rust-powered binary. For new projects, it's becoming a sensible default; for existing ones, its pip-compatible interface makes migration incremental rather than all-or-nothing. If your Python workflow still feels slower than it should, uv is worth the ten minutes it takes to try.
