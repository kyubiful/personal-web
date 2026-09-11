---
title: 'React 19.3: View Transitions and Fragment Refs Go Stable'
pubDate: 2026-09-11
description: 'React 19.3 stabilizes the ViewTransition component and Fragment Refs, and adds browser() for server rendering, Trusted Types support, and direct Context rendering in Server Components. What changed and how to use it.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'A UI animating from one screen to another through a smooth transition.'
tags: ['React', 'JavaScript']
transitionSlug: 'react-19-3-view-transitions-fragment-refs'
---

## Two APIs That Spent a Year in Experimental

React 19.3 shipped just a couple of days ago, and it graduates two pieces the React team had been building toward since their April 2025 labs post: the `<ViewTransition>` component and Fragment Refs. Both move from experimental to stable in this release, with no breaking changes. If you're coming from 19.2 (the one that brought `<Activity>`, `useEffectEvent`, and `cacheSignal`), this is the natural continuation of that same thread: animations and focus/measurement handling without stepping outside React's declarative model.

## `<ViewTransition>`: Animating Without Leaving React

The `<ViewTransition>` component wraps another component and uses the browser's View Transition API to automatically animate four situations: the component **entering** (mounting), **exiting** (unmounting), **updating** (its content or style changes), or being **shared** (a named `<ViewTransition>` moves from one place in the tree to another).

```jsx
import { ViewTransition } from 'react';

{isShowing && (
  <ViewTransition>
    <Component />
  </ViewTransition>
)}
```

There's a requirement that's easy to miss: the animation only fires if the update that triggers it is marked as a Transition, meaning it comes from `startTransition()`, a `<Suspense>` reveal, or `useDeferredValue()`. A regular `setState` stays immediate and doesn't animate anything, precisely so it doesn't introduce latency into interactions that need to feel instant.

To customize the animation you have two paths: CSS classes tied to the transition's lifecycle, or the `onEnter`, `onExit`, `onShare`, and `onUpdate` events if you'd rather drive the animation with the Web Animations API directly.

### `addTransitionType`: Same Transition, Different Animation Depending on the Cause

What's interesting in this release is that knowing *what* changed is no longer enough — you also want to know *why* it changed. `addTransitionType` lets you tag the cause of a Transition so the same `<ViewTransition>` animates differently depending on context:

```jsx
function nextSlide() {
  startTransition(() => {
    addTransitionType('next');
    setCurrentSlide(c => c + 1);
  });
}

function previousSlide() {
  startTransition(() => {
    addTransitionType('previous');
    setCurrentSlide(c => c - 1);
  });
}

<ViewTransition
  enter={{ next: 'from-right', previous: 'from-left' }}
  exit={{ next: 'to-left', previous: 'to-right' }}
>
  <Page />
</ViewTransition>
```

The browser exposes that type through the `:active-view-transition-type(...)` pseudo-selector, so you can also resolve the variation purely in CSS if you'd rather.

### Suspense Integration

Wrapping a `<Suspense>` inside a `<ViewTransition>` animates the transition from fallback to final content as an update. The team's own recommendation is explicit: the fallback should appear immediately, with no animation, and only the fallback-to-final-content transition should animate. To pull that off without stray animations sneaking in:

```jsx
<ViewTransition update="auto" default="none">
  <Suspense fallback={<Fallback />}>
    <Component />
  </Suspense>
</ViewTransition>
```

It's the same pattern worth using for images and fonts: wrapping them in `<ViewTransition>` plus `<Suspense>` avoids the half-loaded-content flicker.

## Fragment Refs: Refs Without a Filler Div

This is, to me, the change with the most quietly outsized impact in this release. Until now, if a component rendered several siblings without a single DOM parent, you had no way to attach a ref to it: the only way out was wrapping everything in a `<div>`, and that div would go on to interfere with your CSS (grids, flexbox, direct-sibling selectors...).

React 19.3 lets you pass a ref directly to a `<Fragment>`:

```jsx
function Component() {
  const fragmentRef = useRef(null);

  useEffect(() => {
    fragmentRef.current.focus();
  }, []);

  return (
    <Fragment ref={fragmentRef}>
      {posts.map(post => (
        <Heading key={post.id}>{post.title}</Heading>
      ))}
    </Fragment>
  );
}
```

That ref doesn't point to a real DOM node (the Fragment doesn't create one), but to a `FragmentInstance` that operates on the set of children as a group: `focus()` focuses the first focusable child, `focusLast()` the last one, `getClientRects()` measures all first-level children, and `observeUsing()` / `unobserveUsing()` let you connect an `IntersectionObserver` or `ResizeObserver` without manually iterating the children. A typical use case, an `InView` component that detects whether any of its children are in the viewport:

```jsx
export default function InView({ onChange, children }) {
  const fragmentRef = useRef(null);

  useLayoutEffect(() => {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      });
      onChange(visible.size > 0);
    });

    fragmentRef.current.observeUsing(observer);
    return () => fragmentRef.current.unobserveUsing(observer);
  }, [onChange]);

  return <Fragment ref={fragmentRef}>{children}</Fragment>;
}
```

Before this, that component would have needed a DOM wrapper just to have something to attach the observer to. Now the Fragment fills that role without touching the layout at all.

## `browser()`: An Explicit Opt-Out From Server Rendering

Anyone who's done SSR has run into the same problem: a component that depends on a browser API (`localStorage`, the local timezone, `window`) has nothing sensible to render on the server. The usual patch was the `mounted`/`isBrowser` pattern, forcing a second client-side render through a `useEffect`. React 19.3 solves it natively with `browser()`:

```jsx
import { use } from 'react';
import { browser } from 'react-dom';

function TimeZone() {
  use(browser()); // suspends on the server, doesn't suspend on the client
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <p>{timeZone}</p>;
}
```

On the server, `use(browser())` triggers Suspense and the fallback ships in the initial HTML. On the client, after hydration, it doesn't suspend and the component renders normally. It's the same idea a custom `useBrowserQuery` hook can build on to decide whether it needs initial data from the server or can resolve everything on the client, without duplicating environment-detection logic in every component.

## Two Smaller Changes Worth Knowing About

- **Real Trusted Types support**: React no longer forces values through string coercion (`'' + value`) before handing them to the DOM. `TrustedHTML`, `TrustedScript`, and `TrustedScriptURL` objects now pass through unchanged, which makes `Content-Security-Policy: require-trusted-types-for 'script'` actually usable with React, no workarounds needed.
- **Direct Context in Server Components**: you no longer need an intermediate `'use client'` component just to wrap a `Context.Provider`. A Server Component can import the `Context` from a `'use client'` module and render it directly:

```jsx
// user-context.js
'use client';
export const UserContext = createContext(null);

// layout.js (Server Component)
import { UserContext } from './user-context';

export async function Layout({ children }) {
  const currentUser = await getCurrentUser();
  return <UserContext value={currentUser}>{children}</UserContext>;
}
```

## Conclusion

None of these APIs reinvent how React is written: they extend the same declarative model into two areas that used to sit outside its reach — native browser animations, and focus/measurement handling over groups of nodes with no common parent. What matters most about 19.3 isn't any single feature, it's the direction it confirms: after labs, then experimental, and now stable, the React team keeps treating visual transitions and low-level DOM access as core parts of the library, not a layer you're left to hand off to Framer Motion or manual refs. If your app hand-rolls page transitions in CSS, or drops in filler divs just to have something to attach a ref to, this release probably just deleted that code for you.
