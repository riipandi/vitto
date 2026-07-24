---
title: Introducing Vitto - A Minimal Static Site Generator Powered by Vite
description: After months of development, I'm excited to introduce Vitto - a minimal, flexible static site generator that combines Vite's blazing-fast development experience with the simplicity of Vento templating.
tags: [vitto, release, announcement, static-site]
author: Aris Ripandi
created: 2025-10-19T09:00:00
updated: 2025-10-19T09:00:00
slug: introducing-vitto
---

After months of development, I'm excited to introduce **Vitto** - a minimal static site generator built as a Vite plugin, powered by the [Vento](https://vento.js.org) templating engine.

## The Problem

Static site generators have become essential tools for modern web development. However, many existing solutions come with significant trade-offs:

> [!WARNING]
> Many popular SSGs lock you into a specific framework (React, Vue, Svelte) or require complex data layers like GraphQL - adding unnecessary complexity for simple content sites.

**Next.js** requires React knowledge and ships JavaScript by default. **Astro** is excellent but introduces its own component model. **Gatsby** has a heavy build pipeline and GraphQL overhead. **Eleventy** is simple but lacks modern build tooling out of the box.

What if you just want:

- [x] A simple static site with fast builds
- [x] No JavaScript framework lock-in
- [x] Minimal configuration
- [x] Built-in search
- [x] Easy integration with any library (HTMX, Alpine.js, Tailwind CSS)

## The Solution

Vitto is a **Vite plugin** that adds static site generation capabilities to your existing Vite setup. It doesn't replace your build pipeline - it enhances it.

### Why Vite?

Vite provides instant HMR, optimized builds via Rolldown, and a rich plugin ecosystem. By building on Vite, Vitto inherits all of these benefits without reinventing the wheel.

```ts
// vite.config.ts - Vitto is just a Vite plugin
import { defineConfig } from 'vite';
import vitto from 'vitto';

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site',
      },
    }),
  ],
});
```

### Why Vento?

[Vento](https://vento.js.org) is a modern templating engine that feels natural for HTML. No JSX, no template literals - just clean templates with expressive syntax:

```vento
{{ layout "layouts/base.vto" }}

<main>
  <h1>{{ title }}</h1>
  {{ if showContent }}
    <p>{{ description }}</p>
  {{ /if }}
</main>
```

## Key Features

### 1. Hook System for Dynamic Data

Vitto's hook system lets you inject data from any source - APIs, files, databases - directly into your templates:

```ts
import { defineHooks } from 'vitto';

export default defineHooks('posts', async () => {
  const response = await fetch('https://api.example.com/posts');
  return response.json();
});
```

> [!TIP]
> Hooks are just async functions. No GraphQL, no special data layer - just JavaScript.

### 2. Dynamic Routes

Generate pages from dynamic data sources with a simple configuration:

```ts
dynamicRoutes: [
  {
    template: 'post',
    dataSource: 'posts',
    getPath: (post) => `blog/${post.slug}.html`,
  },
],
```

### 3. Built-in Search

Search is powered by [Pagefind](https://pagefind.app) - zero-config, full-text search that works offline:

```html
<pagefind-modal-trigger></pagefind-modal-trigger>
```

### 4. Library Freedom

Use any library your way - via npm or CDN:

```vento
{{ layout "layouts/base.vto" }}

<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">Content via Alpine.js</div>
</div>

<div hx-get="/api/data" hx-trigger="click">
  Load via HTMX
</div>
```

## Comparison at a Glance

| Feature              | Vitto     | Next.js           | Astro            | Eleventy |
| -------------------- | --------- | ----------------- | ---------------- | -------- |
| **Build Tool**       | Vite      | Webpack/Turbopack | Vite             | Custom   |
| **Framework Lock**   | None      | React             | Optional         | None     |
| **Built-in Search**  | ✅        | ❌                | ❌               | ❌       |
| **Setup Complexity** | Minimal   | Medium            | Low              | Low      |
| **Vite Plugins**     | ✅ Direct | ❌                | ✅ Through Astro | ❌       |

## When to Use Vitto

Vitto is ideal for:

- **Documentation sites** - Built-in search, markdown support, and fast builds
- **Blogs** - Simple content management with hooks
- **Landing pages** - Zero JavaScript by default
- **Prototypes** - Minimal setup, instant HMR
- **Sites using vanilla JS libraries** - HTMX, Alpine.js, Tailwind CSS, etc.

> [!IMPORTANT]
> Vitto is **not** designed for server-rendered applications or complex web apps. For SSR, consider Next.js or Astro.

## Getting Started

```bash
# Create a new project
npm create vitto@latest my-website
cd my-website
npm run dev
```

## What's Next

The project is under active development. Future plans include:

- [ ] RSS feed generation
- [ ] Sitemap generation
- [ ] Image optimization
- [ ] More template starters

## Try It Out

Vitto is open source and available on [GitHub](https://github.com/riipandi/vitto). Give it a try and let me know what you think!

```bash
# Quick start with Tailwind CSS
npm create vitto@latest my-site -- --preset tailwindcss
cd my-site
npm run dev
```

---

_Built with ❤️ for the static web._
