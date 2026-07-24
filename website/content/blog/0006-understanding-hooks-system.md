---
title: Understanding the Hooks System - Dynamic Data Without the Complexity
description: Vitto's hooks system lets you pull data from anywhere without a heavy data layer. Here's how to use it effectively.
tags: [vitto, hooks, data, tutorial]
author: Aris Ripandi
created: 2026-02-05T11:00:00
updated: 2026-02-07T09:30:00
slug: understanding-hooks-system
---

One of Vitto's defining features is its **hooks system** — a simple but powerful way to inject dynamic data into your static templates.

## The Problem

Static sites are great for performance, but they often struggle with dynamic content. Traditional solutions include:

- Client-side fetching (slow, bad for SEO)
- Build-time data scripts (fragile, hard to maintain)
- External CMS (complex, costly)

## The Hook Solution

Vitto hooks are async functions that run at build time. They fetch or generate data and make it available to your templates:

```ts
// hooks/posts.ts
import { defineHooks } from 'vitto';
import fs from 'node:fs/promises';
import path from 'node:path';

export default defineHooks('posts', async () => {
  const dir = path.join(process.cwd(), 'content/posts');
  const files = await fs.readdir(dir);
  const posts = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      return { slug: file.replace('.md', ''), content };
    })
  );
  return posts;
});
```

## Using Data in Templates

Register the hook in `vite.config.ts`:

```ts
vitto({
  hooks: {
    posts: postsHook,
  },
});
```

Then access the data in any template:

```vento
{{ for post of posts }}
  <article>
    <h2>{{ post.title }}</h2>
    <a href="/blog/{{ post.slug }}">Read more</a>
  </article>
{{ /for }}
```

## Hook Types

| Type              | Use Case              | Example                      |
| ----------------- | --------------------- | ---------------------------- |
| **Static**        | Fixed data            | Navigation menu, site config |
| **Async**         | API calls, file reads | Blog posts, product listings |
| **Parameterized** | Filtered queries      | Single post, search results  |

## Best Practices

- [x] Handle errors gracefully — return empty arrays instead of throwing
- [x] Cache expensive operations when possible
- [x] Keep hooks focused on a single data source
- [x] Use TypeScript types for better IDE support

> [!WARNING]
> Hooks run at every build. For data that rarely changes, consider caching or writing it directly to a JSON file.
