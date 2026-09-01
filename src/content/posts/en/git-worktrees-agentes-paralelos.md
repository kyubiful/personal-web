---
title: 'Git Worktrees: Real Isolation for Parallel AI Agents'
pubDate: 2026-09-02
description: 'How to use git worktrees so multiple AI agents (Claude Code, OpenCode) can write code at the same time without stepping on each other. Practical commands, the real-world workflow, and the gotchas nobody mentions.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Multiple copies of the same code repository working in parallel, each on its own branch.'
tags: ['AI', 'Developer Tools']
transitionSlug: 'git-worktrees-agentes-paralelos'
---

## One Repository, One HEAD

A normal working tree has a limitation you rarely think twice about: it can only have one branch checked out at a time. You switch branches, `HEAD` points somewhere else, the index updates, and the files on disk reflect that state. If you try to do two things at once in the same directory — two branches, two sets of uncommitted changes, two processes writing files — something gets clobbered.

That was always a tolerable limitation when the one working in the repo was you, a single person, one task at a time. It stops being tolerable the moment multiple AI agents write code concurrently against the same checkout.

## The Concrete Problem with Parallel Agents

If you delegate two writing tasks to two different subagents — say, one implementing an endpoint and another writing its tests — and both work on the same working tree, you end up with one of these:

- One agent edits a file the other had open with uncommitted changes, and those changes get lost.
- Both try to `git stash` or `git checkout` at the same time, leaving the index in an inconsistent state.
- One installs dependencies or runs a build while the other modifies `package.json`, and neither result is trustworthy anymore.

This isn't a matter of agents "not getting along": a single working tree physically cannot represent two states at once. The fix isn't finer coordination between agents, it's giving each one its own directory.

## What a Worktree Actually Is

A **git worktree** is a second (or third, or tenth) working directory linked to the same repository: they share the same object store (`.git`), but each worktree has its own `HEAD`, its own index, and its own files on disk. This is native git, not an external tool or a symlink trick.

```bash
# Create a new worktree with a new branch
git worktree add ../my-repo-feature-x -b feature-x

# List active worktrees
git worktree list

# Remove a worktree once it's merged or discarded
git worktree remove ../my-repo-feature-x

# Clean up references to worktrees you deleted by hand
git worktree prune
```

`git worktree add` sets up the repo structure in a new folder and points it at whatever branch you give it (existing, or a new one via `-b`). From there it's a full working directory: you can install dependencies, run the project, make commits, all completely isolated from everything else. The one real constraint is that the same branch can't be checked out in two worktrees at once; git will refuse explicitly.

## How Claude Code and OpenCode Actually Use This

This is exactly what's behind the worktree-isolation option in agents like Claude Code or OpenCode when you launch a writer subagent: instead of the subagent working on your current checkout, the tool creates a fresh worktree, checks it out to its own branch, and lets the agent edit and commit freely inside it. If the agent breaks something or takes the wrong approach, your main working tree never knew: there's nothing to revert because nothing was ever touched.

The typical flow looks like this:

1. A worktree gets created per task or per agent (`git worktree add ../repo-task-name -b agent/task-name`).
2. The agent works, commits, and runs its own tests inside that worktree.
3. When it's done, you review that branch's diff the way you'd review any PR: merge it, rebase it, or discard it outright.
4. Once it's merged or discarded, you remove the worktree.

Multiple agents can run in parallel with no explicit coordination between them, because at the filesystem level they're in separate directories. The only real coordination happens at the end, when you decide which branches actually land on trunk.

## The Gotcha: State That Lives Outside Git Doesn't Follow the Worktree

There's a detail that catches people off guard the first time: any tool that maintains derived state about the code — a search index, a static-analysis cache, a symbol graph for autocomplete — usually lives outside version control, in some `.tool/` folder git ignores. That index was built against the bytes of one specific checkout.

When you create a new worktree, the content on disk can be different (a different branch, different files, different state), but that tool's index doesn't automatically travel with you: it still reflects the checkout it was generated from. If you try to reuse the same index from the new worktree, you'll get results that don't match what's actually on disk. The practical fix is simple but easy to forget: each worktree needs its own index, built against its own content. It's not a bug in the tool, it's a direct consequence of the worktree being a real working copy while the index isn't part of git at all.

## Cleanup: When It's Safe to Remove a Worktree

A worktree is safe to remove once its branch is merged (or explicitly discarded) and there's no uncommitted work in it you care about. `git worktree remove` fails if it detects unsaved changes, as a safeguard. If you deleted the folder by hand instead of using `remove` — say, with `rm -rf` — git will keep listing that reference as if it still existed until you run `git worktree prune`, which clears out references to directories that no longer exist on disk.

## When You Don't Need Worktrees

If you're working with a single agent at a time, sequentially, a normal feature branch is more than enough: switching branches in the same working tree costs nothing when there's no real concurrency. Worktrees earn their keep specifically when there's **genuine simultaneous writing** — multiple agents, or you and an agent at the same time — against the same repository. Outside of that, they're an extra layer of complexity (more directories to manage, more duplicated dependency installs) that buys you nothing.

## Conclusion

Worktrees aren't a new feature, and they weren't originally built with AI in mind: git has had them for years, for cases like keeping a hotfix on one branch while you keep developing on another, without `stash`-ing every two minutes. What's changed is that they're now the obvious piece of infrastructure for a new problem: giving every agent writing code in parallel its own real, filesystem-level space, without depending on the agent itself being perfectly disciplined. As working with several agents at once stops being the exception, it's worth making the `git worktree add` / review / merge / `remove` flow as automatic as creating a branch already is.
