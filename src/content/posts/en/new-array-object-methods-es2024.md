---
title: 'New Array and Object Methods in Modern JavaScript (ES2024+)'
pubDate: 2026-07-20
description: 'A practical tour of the built-in methods that recently landed in JavaScript engines: Object.groupBy, Map.groupBy, Promise.withResolvers, Array.fromAsync, and the new Set composition methods. No more reduce() gymnastics or manual polyfills.'
author: 'Sergio Zabala'
image:
  url: '/javascript.webp'
  alt: 'JavaScript logo.'
tags: ["JavaScript", "ECMAScript"]
transitionSlug: 'new-array-object-methods-es2024'
---

For years, grouping an array or composing two `Set` objects meant reaching for Lodash or writing the same `reduce()` boilerplate over and over. That is no longer necessary. Several TC39 proposals reached Stage 4 and shipped across engines in 2024, and they are now safe to use in any reasonably current environment. Let's go through them.

## Grouping Data: Object.groupBy() and Map.groupBy()

`Object.groupBy()` takes an iterable and a callback, and returns a null-prototype object whose keys are the group names:

```javascript
const inventory = [
  { name: 'asparagus', type: 'vegetables', quantity: 5 },
  { name: 'bananas', type: 'fruit', quantity: 0 },
  { name: 'goat', type: 'meat', quantity: 23 },
];

const byType = Object.groupBy(inventory, ({ type }) => type);
// {
//   vegetables: [{ name: 'asparagus', ... }],
//   fruit: [{ name: 'bananas', ... }],
//   meat: [{ name: 'goat', ... }]
// }
```

If your grouping key needs to be something other than a string (an object reference, for instance), use `Map.groupBy()` instead. It works the same way but returns a real `Map`, so keys can be any value and don't need to be coerced to strings:

```javascript
const restock = { restock: true };
const sufficient = { restock: false };

const byStock = Map.groupBy(inventory, ({ quantity }) =>
  quantity < 6 ? restock : sufficient
);

byStock.get(restock);
// [{ name: 'bananas', type: 'fruit', quantity: 0 }]
```

Both methods have been Baseline "newly available" since March 2024 and now run natively in every major browser and in Node.js.

## Settling Promises From the Outside: Promise.withResolvers()

Ever needed to expose a promise's `resolve`/`reject` functions outside of the executor callback? Before `Promise.withResolvers()`, this meant declaring `let resolve` and `let reject` above the `new Promise(...)` call. Now it's a single call:

```javascript
const { promise, resolve, reject } = Promise.withResolvers();

button.addEventListener('click', () => resolve('clicked!'));

promise.then((value) => console.log(value));
```

This is particularly handy for streams, event-driven queues, and any code that needs to bridge callback-based APIs with promises. It shipped in Node.js 21.7 (and 22+ by default) and across all major browsers in early 2024.

## Building Arrays From Async Sources: Array.fromAsync()

`Array.fromAsync()` mirrors `Array.from()`, but it understands async iterables and awaits any promises it encounters, returning a promise that resolves to the final array:

```javascript
async function* range(start, end, delayMs) {
  for (let i = start; i <= end; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield i;
  }
}

const values = await Array.fromAsync(range(0, 4, 10));
// [0, 1, 2, 3, 4]
```

It also works on regular iterables of promises, awaiting each one:

```javascript
await Array.fromAsync([Promise.resolve(1), Promise.resolve(2)]);
// [1, 2]
```

No more `for await...of` loops just to collect results into an array. `Array.fromAsync()` has been widely available since January 2024.

## Real Set Math: union(), intersection(), difference() and Friends

`Set` finally got the composition methods every other language's set type already had. Since June 2024, every `Set` instance exposes `union()`, `intersection()`, `difference()`, `symmetricDifference()`, `isSubsetOf()`, `isSupersetOf()`, and `isDisjointFrom()`:

```javascript
const evens = new Set([2, 4, 6, 8]);
const squares = new Set([1, 4, 9]);

evens.union(squares);
// Set(6) { 2, 4, 6, 8, 1, 9 }

evens.intersection(squares);
// Set(1) { 4 }

evens.difference(squares);
// Set(3) { 2, 6, 8 }

evens.isDisjointFrom(new Set([1, 3, 5]));
// true
```

No more converting to arrays, filtering, and converting back. Each method also accepts any "set-like" object, not just a `Set` instance, which keeps interop simple.

## Conclusion

`Object.groupBy()`, `Map.groupBy()`, `Promise.withResolvers()`, `Array.fromAsync()`, and the new `Set` methods all reached Baseline in 2024 and are safe to reach for today in any modern browser or Node.js runtime. None of them are revolutionary on their own, but together they close long-standing gaps that used to justify pulling in a utility library. The platform keeps absorbing the patterns developers reach for the most — and that's exactly the kind of "boring" progress worth paying attention to.
