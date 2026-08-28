---
title: 'Agents and Subagents: Orchestrating AI Development with Claude Code and OpenCode'
pubDate: 2026-08-28
description: 'How Claude Code and OpenCode delegate scoped tasks to specialized subagents to keep context clean, parallelize work, and isolate changes. What they are, when to delegate, and how to define your own subagent.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'An orchestrator agent delegating tasks to several specialized subagents.'
tags: ['AI', 'Developer Tools']
transitionSlug: 'agentes-subagentes-claude-code-opencode'
---

## The Limit of a Single Conversation

If you use an agentic AI assistant in the terminal to work on a real codebase, you eventually hit the same problem: a single conversation accumulates too much context. You explore four files to understand a function, read the full output of a build, review a huge diff, and all of that stays floating in the same context window, even though you only needed a three-line conclusion.

Both **Claude Code** and **OpenCode** solve this with the same underlying concept: instead of one agent carrying everything, an **orchestrator agent** delegates scoped tasks to **subagents** that run in their own isolated context and return only the final result. The noise of exploration — files read, commands run, failed attempts — stays on the subagent's side; the main thread only receives the synthesis.

## What a Subagent Actually Is

A subagent is, at its core, a full agent (with its own system prompt, its own tools, and sometimes its own model) invoked for one well-scoped task:

- Exploring a codebase to answer "where is this function defined, and who calls it?"
- Writing two or more non-trivial files whose design is already settled.
- Running an adversarial code review with its own rules.
- Running a test suite or a build and reporting only the outcome.

What matters is that the agent invoking it **doesn't need to see the process**, only the result. This drastically reduces the context the main thread has to carry throughout the session.

## Claude Code: The `Task`/`Agent` Tool and Custom Agents

In Claude Code, the orchestrator has an agent tool that launches subagents with a `subagent_type`. There are predefined types — for example a read-only exploration type for quick code searches, or a planning type for designing an implementation strategy — and you can also define your own as Markdown files under `.claude/agents/`:

```markdown
---
name: security-reviewer
description: Reviews code changes for security vulnerabilities before a merge.
tools: Read, Grep, Glob
model: sonnet
---

You are a security reviewer. Analyze the diff for command injection,
XSS, SQL injection, and other OWASP Top 10 risks. Report only verified
findings, ordered by severity.
```

The frontmatter defines the name, when it activates (`description`), which tools it has available, and which model it uses. A subagent with `tools: Read, Grep, Glob` can't write files or run commands, so it acts as a read-only reviewer by design, not by convention.

Claude Code also supports **forks**: a subagent that inherits the entire context of the current conversation (unlike a fresh agent, which starts with no memory) and runs in the background while you keep chatting. This is useful for open-ended exploratory questions where the search noise isn't worth bringing back, but the context you've already built is.

## OpenCode: The Same Pattern, Different Syntax

OpenCode implements an equivalent idea. Agents are defined as Markdown files under `.opencode/agent/`, with frontmatter that includes `description`, `mode`, and the allowed tools:

```markdown
---
description: Runs the test suite and reports only failures
mode: subagent
tools:
  write: false
  edit: false
---

Run the project's test suite. If anything fails, report the file,
the line, and the exact error message. If everything passes, reply only "OK".
```

The `mode` field can be `primary` (the main conversational agent), `subagent` (invocable only through delegation), or `all` (both). A subagent can be invoked automatically when its `description` matches the task, or manually by mentioning it with `@agent-name` in the message.

The syntax difference between the two tools is superficial; the underlying design is the same: **isolate the execution context, scope the available tools to what the task needs, and return only the synthesis to the delegating agent**.

## When to Delegate, and When Not To

Delegating isn't free: launching a subagent has a startup cost (it doesn't share the conversation's cache the same way continuing in the same thread does) and adds a round trip. The useful question before delegating is: **does this read or write inflate the main thread's context without need?**

Practical rules that tend to work well:

- Reading 1-3 files to decide or verify something specific: do it inline.
- Exploring 4 or more files to understand something: delegate one scoped exploration.
- Writing a single mechanical, already-understood file: inline.
- Writing two or more non-trivial files, or preparing a write with prior research: delegate a writer.
- Tests, builds, installs, code reviews: these are always worth a fresh subagent, even for one-off actions inside a flow that's otherwise inline.

## Real Isolation: Worktrees for Parallel Writers

When several subagents need to write code at the same time, delegating alone isn't enough if they share the same working tree: they'll step on each other's changes. Both Claude Code and OpenCode support launching a subagent inside its own **git worktree**, so each writer works on its own isolated copy of the repository, and the result is integrated (or discarded) explicitly once it's done. This avoids the classic case of two agents editing the same file at once and corrupting the repo's state.

## Conclusion

The orchestrator-plus-specialized-subagents pattern isn't a new idea in software engineering: it's the same principle behind microservices, splitting a monolith into scoped responsibilities, or a tech lead delegating concrete tasks to their team instead of doing everything themselves. What's new is that this pattern now applies to how you interact with your AI assistant: keep the main thread lean, and let heavy, noisy, or parallelizable work happen in isolated agents that only report back what matters. If your conversations with Claude Code or OpenCode start feeling slow or losing focus as they grow, the fix is rarely "explain better": it's almost always "delegate better."
