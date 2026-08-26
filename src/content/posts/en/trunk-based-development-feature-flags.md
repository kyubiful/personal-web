---
title: 'Trunk-Based Development and Feature Flags: A Practical Alternative to Git-Flow'
pubDate: 2026-06-15
description: 'Git-flow promises order through long-lived branches, but in practice it often trades merge pain for release pain. This post explains trunk-based development and feature flags as a leaner alternative for shipping software continuously.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagram of a single trunk branch with short-lived commits merging directly into main.'
tags: ['Software Development', 'Git', 'Best Practices']
transitionSlug: 'trunk-based-development-feature-flags'
---

## The Problem with Long-Lived Branches

Git-flow was designed for a world of scheduled releases: `develop`, `release/*`, `feature/*`, and `hotfix/*` branches all exist to isolate work until it is "ready." The trade-off is that isolation is exactly what delays integration. A feature branch that lives for weeks accumulates drift against `main`, and the eventual merge becomes a high-risk event instead of a routine one.

Google's own engineering culture calls this out directly. In _Software Engineering at Google_, the authors describe teams becoming "addicted to dev branches": they notice that merging large branches destabilizes the codebase, then wrongly conclude the fix is more branch isolation rather than less. The result is escalating overhead — dedicated merge coordination, "Build Master" rotations, and release-branch bureaucracy that the book flatly calls "pure overhead."

## What Trunk-Based Development Actually Is

[Trunk-based development](https://trunkbaseddevelopment.com/) (TBD) is a source-control model where developers integrate to a single branch — the trunk, usually `main` — continuously, instead of working in isolation for long stretches. The core practices are simple:

- **Short-lived branches.** Any feature branch should live for at most a day or two before merging. Longer than that, and it starts behaving like a git-flow feature branch again.
- **Frequent integration.** Developers commit to trunk at least once a day, which is what makes continuous integration (CI) meaningful in the first place — you can't integrate continuously if nobody integrates.
- **A build server that never sleeps.** Every commit to trunk triggers a build and test run. If it breaks, fixing it is the team's top priority, not a someday task.
- **Release branches, if any, are short and disposable.** They're cut just-in-time from trunk for a release and deleted afterward — they don't accumulate ongoing feature work.

This isn't a small-team trick. Google runs trunk-based development across roughly 35,000 engineers in a single monorepo, and only a handful of its ~1,000 teams maintain long-lived branches at all, typically for unusual backward-compatibility constraints.

## Why Feature Flags Make This Possible

The obvious objection to TBD is: "How do I merge a half-finished feature into `main` without breaking production?" The answer is feature flags (also called feature toggles).

Martin Fowler's canonical explanation is that a [feature toggle](https://martinfowler.com/bliki/FeatureToggle.html) is a conditional that lets you change system behavior without changing code. In the trunk-based context, this means:

```js
if (featureFlags.newCheckoutFlow) {
  renderNewCheckout()
} else {
  renderLegacyCheckout()
}
```

The code for `newCheckoutFlow` can be merged to `main` in small, reviewable increments over days or weeks. The flag stays off in production until the feature is actually done, at which point flipping it is a configuration change, not a deployment. As [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/feature-flags/) puts it, this lets code be merged "before it's ready for production," which is precisely what eliminates the need for a long-running feature branch.

Fowler categorizes toggles by purpose, and it's worth knowing the distinction because it affects how long a flag should live:

- **Release toggles** — hide in-progress work, meant to be short-lived and removed once shipped.
- **Experiment toggles** — power A/B tests, live only as long as the experiment.
- **Ops toggles** — give operators a runtime kill switch, may live indefinitely.
- **Permissioning toggles** — gate features by user segment (e.g., beta users, paid tiers), often long-lived by design.

Release toggles — the ones that replace git-flow feature branches — are the ones that most need a cleanup plan.

## Practical Guidance

**Keep branches genuinely short.** If a branch is still open after two days, that's a signal to either merge behind a flag or split the work further. The branch is for code review and CI, not for hiding incomplete functionality.

**Gate at the entry point, not everywhere.** Fowler warns against scattering `if` checks through the codebase — wrap the new behavior once, ideally with a seam like dependency injection, rather than littering conditionals across every layer.

**Make CI test the meaningful flag states.** A pipeline that only ever tests with flags off isn't testing what will actually ship. Trunk-based development's guidance is to fan out test runs after the unit-test stage for each meaningful flag combination, not every combinatorial permutation.

**Treat flag cleanup as part of the definition of done.** This is the discipline teams skip most often. Fowler's warning is blunt: if creating, maintaining, or removing flags takes significant effort, you have too many of them. The trunkbaseddevelopment.com guidance is concrete — document an expected review-for-deletion date when the flag is created, and schedule the removal (with product sign-off) roughly a month after the feature ships. A flag nobody remembers is just dead conditional logic waiting to cause a bug.

**Reserve toggles as a last resort, not a default tool.** Fowler is explicit that smaller releases, or a "keystone" approach (build the backend fully, wire up the UI last), should be tried before reaching for a flag. Feature flags solve a real problem, but every flag is also a small amount of permanent complexity until it's removed.

## Conclusion: Fewer Branches, More Discipline

Trunk-based development doesn't remove the need for discipline — it relocates it. Git-flow enforces discipline through branch structure and merge ceremony; TBD enforces it through small commits, a CI pipeline that can't be ignored, and feature flags that must eventually be deleted. For teams shipping continuously, that trade tends to pay off: less merge pain, faster feedback, and a `main` branch that is always close to what's actually running in production.
