---
title: 'Agent Skills: Packaging Reusable Knowledge for Your AI Assistant'
pubDate: 2026-08-27
description: 'Agent Skills let you package reusable instructions, scripts, and templates into folders that an AI agent loads on demand. Learn what they are, when creating one makes sense, and how to structure an effective SKILL.md.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Instruction folders loading dynamically into an AI agent.'
tags: ['AI', 'Developer Tools']
transitionSlug: 'agent-skills-desarrollo-ia'
---

## The Problem: Repeating the Same Context Over and Over

If you work with an AI coding assistant daily, you'll recognize the pattern: you explain the same commit convention, the same review checklist, or the same ticket-creation flow, over and over across different conversations. Stuffing everything into a single global instructions file (`CLAUDE.md`, `AGENTS.md`, or equivalent) works up to a point, but that file grows unchecked, eats context on every turn even when irrelevant, and becomes hard to maintain.

**Agent Skills** (or simply *skills*) solve this differently: instead of one monolithic document, you package each workflow into its own folder with scoped instructions that the agent discovers and loads **only when the task calls for it**.

## What Exactly Is a Skill?

A skill is a folder with a minimal structure:

```
skills/{skill-name}/
├── SKILL.md              # Required: main instructions
├── assets/                # Optional: templates, schemas, examples
│   ├── template.py
│   └── schema.json
└── references/            # Optional: supporting docs
    └── docs.md
```

The `SKILL.md` file carries a YAML frontmatter with key metadata:

```yaml
---
name: create-jira-ticket
description: "Trigger: create ticket, issue, Jira task. Creates Jira tickets following the team's format."
license: Apache-2.0
metadata:
  author: "your-username"
  version: "1.0"
---
```

The `description` field is the most important part of the whole file: it's what the agent reads to decide, without loading the rest of the content, whether this skill is relevant to the current task. That's why it must include the trigger keywords a user or agent would naturally use when they need that workflow.

## Why This Design Matters: On-Demand Loading

The key difference from one giant instructions file is **lazy discovery**. The agent keeps only each available skill's name and description in memory; the full instruction body is loaded only once it detects the task matches the trigger. This has two direct benefits:

- **Context doesn't get saturated** with instructions irrelevant to the task at hand.
- **Skills can be versioned and maintained independently**, each scoped to one concrete domain (opening a PR, generating a report, following a testing convention), so a change in one doesn't ripple into the others.

## When to Create a Skill (and When Not To)

Not everything deserves to become a skill. Before creating one, it's worth asking:

- Does this pattern repeat frequently, and does the agent need specific guidance to execute it well?
- Do this project's conventions differ from what the agent would assume by default?
- Does the workflow have concrete steps, conditional decisions, or templates worth fixing in writing?

If the answer is no — the pattern is trivial, a one-off, or already well covered by normal documentation — you probably don't need a new skill.

## Best Practices for Writing the Body

A well-written skill isn't a tutorial for humans: it's an **instruction contract for a model**. A few rules make the difference:

1. **Be imperative, not explanatory.** Instead of narrating how something works, state what to do step by step.
2. **Keep the body short.** Aim for a few hundred tokens; if you need to explain a long concept or an edge case, move it to `references/` and link it.
3. **Use decision tables** when several paths exist, instead of long conditional paragraphs.
4. **Put templates and schemas in `assets/`**, not inline in `SKILL.md`.
5. **Avoid a separate "Keywords" section.** Essential trigger words belong inside `description`, not in a separate block.

## A Minimal Example

```markdown
---
name: review-pr
description: "Trigger: review PR, code review, pull request. Applies the team's review checklist before approving a PR."
license: Apache-2.0
metadata:
  author: "your-username"
  version: "1.0"
---

## Mandatory Rules

- Verify tests exist for every business logic change.
- Reject any PR that includes plaintext credentials or secrets.
- Confirm the PR title follows Conventional Commits.

## Expected Output

Return a list of findings ordered by severity, or "No findings" if the PR meets the checklist.
```

With this in place, any agent that detects a code review task will load these rules automatically, without you having to repeat them in the prompt.

## Conclusion

Agent Skills are, at their core, a way of applying a well-known software engineering principle — separation of concerns and lazy loading — to the context of an AI agent. Instead of a single instructions file that grows without bound, you end up with a catalog of modular, versionable, maintainable capabilities, each activating only when it actually adds value. If your team keeps repeating the same workflows with an AI assistant week after week, packaging them as skills is one of the best-return investments you can make in your tooling setup.
