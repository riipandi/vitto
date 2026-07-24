---
title: Zero-Config Search with Pagefind - Making Your Static Site Searchable
description: Add full-text search to your static site in minutes with Pagefind. No external services, no server, no complex setup - just search that works offline.
tags: [search, pagefind, tutorial, performance]
author: Aris Ripandi
created: 2025-12-14T10:00:00
updated: 2025-12-20T14:30:00
slug: zero-config-search-pagefind
---

Search is one of the most requested features for documentation sites and blogs. But traditionally, adding search to a static site was either:

1. **Complex** - Set up Elasticsearch or Algolia (costly, heavy)
2. **Limited** - Client-side JS search over a JSON index (slow for large sites)
3. **External** - Rely on Google Custom Search (ads, branding, privacy concerns)

**Pagefind** solves all of this. It's a static search library that generates a full-text search index at build time and runs entirely in the browser - no server needed.

## How It Works

Pagefind works in two phases:

```mermaid
Build time:  HTML pages → Pagefind index → `_pagefind/` directory
Runtime:     User types → WASM-powered search → Instant results
```

Vitto integrates Pagefind out of the box. When you build your site, the search index is generated automatically:

```bash
npm run build
# ✨ Indexed 140 pages in 97 ms
# ✨ Search index written to: dist/_pagefind
```

## Setup

### 1. Enable Search (it's on by default)

Vitto enables search by default. You can configure it in `vite.config.ts`:

```ts
vitto({
  enableSearchIndex: true,
  pagefindOptions: {
    rootSelector: 'html',
    writePlayground: false,
    keepIndexUrl: true,
  },
});
```

> [!NOTE]
> Pagefind indexes **every HTML page** it finds. The index lives in `dist/_pagefind/` and is deployed alongside your site.

### 2. Add the Search UI

Vitto comes with the Pagefind UI component built in. Add the trigger anywhere in your layout:

```vento
{{ layout 'layouts/base.vto' }}

<header>
  <nav>
    <!-- Desktop search trigger -->
    <pagefind-modal-trigger class="search-trigger"></pagefind-modal-trigger>
  </nav>
</header>

{{ content }}

<!-- Modal (loaded once at the bottom) -->
<pagefind-modal reset-on-close></pagefind-modal>
```

The modal opens on click or with `Ctrl+K` / `Cmd+K`.

### 3. Style It

Pagefind uses CSS variables for theming. Vitto's default theme already includes sand/amber styling:

```css
/* Override in your global.css */
:root {
  --pf-background: #faf9f6;
  --pf-text: #1a1814;
  --pf-border-focus: #fbbf24;
  --pf-mark: #d97706;
}
```

## Optimizing Search

### Mark Content Explicitly

Tell Pagefind which content to index using `data-pagefind-body`:

```vento
<nav data-pagefind-ignore>
  <!-- Navigation - excluded from search -->
</nav>

<main data-pagefind-body>
  <!-- Main content - indexed -->
  {{ content |> safe }}
</main>
```

> [!TIP]
> Excluding navigation, footers, and sidebars from the index reduces size and improves result relevance.

### Add Metadata for Better Results

```html
<div data-pagefind-meta="title:{{ title }}; date:{{ date }}"></div>
```

### Filter by Categories

Use data attributes to enable faceted search:

```html
<article data-pagefind-filter="section:{{ section }}">{{ content }}</article>
```

## Performance Characteristics

| Metric                  | Value                |
| ----------------------- | -------------------- |
| Index size (100 pages)  | ~200-400 KB          |
| Index size (1000 pages) | ~2-4 MB              |
| Search latency          | < 50ms               |
| Bundle size             | ~30KB WASM           |
| Offline support         | Yes (service worker) |

> [!WARNING]
> For sites with over 10,000 pages, consider splitting the index or using a hybrid approach. Pagefind is optimized for small to medium sites.

## Advanced: Custom UI

If you want a fully custom search experience, use Pagefind's JS API directly:

```ts
import Pagefind from 'pagefind';

const pagefind = await Pagefind();
const results = await pagefind.search('static site');

results.results.forEach(async (result) => {
  const data = await result.data();
  console.log(data.url, data.meta.title, data.excerpt);
});
```

## Why Not Algolia or Meilisearch?

| Feature        | Pagefind     | Algolia     | Meilisearch          |
| -------------- | ------------ | ----------- | -------------------- |
| **Cost**       | Free         | Usage-based | Self-hosted or cloud |
| **Server**     | None needed  | Required    | Required             |
| **Offline**    | Yes          | No          | No                   |
| **Setup time** | Minutes      | Hours       | Hours                |
| **Relevance**  | Good         | Excellent   | Excellent            |
| **Scale**      | Small-medium | Any         | Any                  |

Pagefind is the right choice for documentation sites, blogs, and content sites with thousands of pages. For e-commerce or sites needing advanced relevance tuning, a hosted solution may be better.

## Try It

Build your Vitto site and press `Ctrl+K` to see search in action. The entire index is generated at build time -- deploy anywhere and it just works.

```bash
npm create vitto@latest my-site
cd my-site
npm run dev
# Press Ctrl+K to search
```
