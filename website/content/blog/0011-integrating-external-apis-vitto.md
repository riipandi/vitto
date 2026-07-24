---
title: Integrating External APIs with Vitto Hooks
description: Learn how to fetch data from REST APIs, headless CMS platforms, and databases at build time using Vitto's hooks system.
tags: [vitto, api, hooks, tutorial, data-fetching]
author: Aris Ripandi
created: 2026-03-25T13:00:00
updated: 2026-03-28T09:00:00
slug: integrating-external-apis-vitto
---

Static sites don't mean static data. Vitto hooks can fetch from any API at build time, making external data part of your compiled site.

## Fetching from a REST API

```ts
// hooks/products.ts
import { defineHooks } from 'vitto';

export default defineHooks('products', async () => {
  const res = await fetch('https://api.example.com/products');
  if (!res.ok) return [];
  return res.json();
});
```

## Connecting to a Headless CMS

### Strapi

```ts
export default defineHooks('pages', async () => {
  const res = await fetch(`${process.env.STRAPI_URL}/api/pages?populate=*`, {
    headers: { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` },
  });
  const { data } = await res.json();
  return data.map((item) => ({
    slug: item.attributes.slug,
    title: item.attributes.title,
    content: item.attributes.content,
  }));
});
```

### Sanity

```ts
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  useCdn: true,
});

export default defineHooks('posts', async () => {
  return await client.fetch(`*[_type == "post"]{slug, title, body}`);
});
```

## Reading from the File System

```ts
import fs from 'node:fs/promises';
import path from 'node:path';

export default defineHooks('data', async () => {
  const filePath = path.join(process.cwd(), 'data/products.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
});
```

## Combining Multiple Sources

```ts
export default defineHooks('site', async () => {
  const [posts, products, settings] = await Promise.all([
    fetchPosts(),
    fetchProducts(),
    fetchSettings(),
  ]);
  return { posts, products, settings };
});
```

## Error Handling

Always handle errors gracefully:

```ts
export default defineHooks('posts', async () => {
  try {
    const res = await fetch('https://api.example.com/posts');
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return []; // Return empty array on failure
  }
});
```

> [!WARNING]
> API keys and tokens used in hooks are only available at build time. Never expose secrets in client-side code.

## Performance Tips

- [x] Cache API responses when data doesn't change often
- [x] Use `Promise.all` for independent requests
- [x] Set reasonable timeout limits
- [x] Validate data shape before returning

```ts
const CACHE_DURATION = 60_000; // 1 minute
let cache = null;
let cacheTime = 0;

export default defineHooks('data', async () => {
  if (Date.now() - cacheTime < CACHE_DURATION) return cache;
  cache = await fetchExpensiveData();
  cacheTime = Date.now();
  return cache;
});
```
