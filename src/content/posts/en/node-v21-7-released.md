---
title: "What's New in NodeJS Version 21.7"
pubDate: 2024-03-14
description: 'Discover how NodeJS is transforming development with its latest updates: native environment variable management and console coloring without external dependencies. These innovations simplify the workflow and pave the way for a more efficient and minimalist future in programming.'
author: 'Sergio Zabala'
image:
  url: '/nodejs.webp'
  alt: 'NodeJS logo.'
tags: ['NodeJS', 'JavaScript']
transitionSlug: 'node-v21-7-released'
---

## Goodbye to the dotenv Dependency

The first update brings us native environment variable management without the need for dependencies.

Now with the `process.loadEnvFile()` function, we can load environment variables directly without having to manually specify the `.env` file to load.

If we want to load a specific file, we can also pass the path of the file `process.loadEnvFile('./.env.prod')`.

```env
API_KEY=ABXDEDFASDFSGSF
```

```js
// This would load the default .env file
process.loadEnvFile()

// This would load a specific file
process.loadEnvFile('./.env.dev')
```

## No More Dependencies for Coloring the Console

The second new feature within node is the ability to add colors to your console natively. Previously, libraries like `chalk` were used. However, from this version of node, we can color it without needing dependencies.

```js
const { styleText } = require('node:util')
const port = 3000

const message = styleText('red', `server started on port ${port}`)

console.log(message)
```

## Conclusion: A Necessary Evolution

These updates simplify the workflow and eliminate the need for additional dependencies.

Although these features are available in the current version of Node, it's important to mention that they are not considered LTS yet, which means they might not be the most stable option for production environments. However, with the next version 22 on the horizon, expected in April, these features will be ready for wider adoption.
