---
title: Building Interactive Sites with HTMX and Alpine.js on Vitto
description: Learn how to add dynamic interactions to your static site without a heavy JavaScript framework. Vitto makes it seamless to integrate HTMX and Alpine.js.
tags: [htmx, alpinejs, tutorial, javascript, vento]
author: Aris Ripandi
created: 2026-02-08T15:00:00
updated: 2026-02-15T11:00:00
---

One of the best things about building with Vitto is the freedom to choose your tools. Unlike framework-locked SSGs, Vitto lets you reach for exactly what you need.

Two libraries that pair particularly well with static sites are **HTMX** and **Alpine.js** - and they work together beautifully.

## Why HTMX and Alpine.js?

| Library       | Purpose                                           | Bundle Size    |
| ------------- | ------------------------------------------------- | -------------- |
| **HTMX**      | Server-driven AJAX, form submissions, SSE         | ~14KB min+gzip |
| **Alpine.js** | Client-side interactivity (toggles, tabs, modals) | ~16KB min+gzip |
| **Together**  | Full interactivity without a framework            | ~30KB total    |

> [!TIP]
> Both libraries work via HTML attributes. No virtual DOM, no build step, no JSX - just declarative HTML.

## Setup

Install via npm:

```bash
npm install htmx.org alpinejs
```

Then import in your main entry point:

```ts
// src/main.ts
import 'htmx.org';
import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();
```

Or use CDN for quick prototyping:

```vento
{{ layout "layouts/base.vto" }}

<head>
  {{ renderAssets() |> safe }}
  <script src="https://unpkg.com/htmx.org@2.0.0"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
```

## Examples

### 1. Dynamic Search with HTMX

Create a search endpoint and use HTMX to fetch results as the user types:

```vento
<!-- src/pages/index.vto -->
<div x-data="{ query: '' }">
  <input
    type="search"
    x-model="query"
    hx-get="/search-results"
    hx-trigger="keyup changed delay:300ms"
    hx-target="#results"
    hx-include="[name='q']"
    name="q"
    placeholder="Search..."
    class="px-4 py-2 border rounded-lg"
  />
  <div id="results" class="mt-4">
    <!-- HTMX injects results here -->
  </div>
</div>
```

### 2. Interactive Tabs with Alpine.js

No JavaScript needed - just Alpine directives:

```vento
<div x-data="{ tab: 'features' }">
  <nav class="flex gap-2">
    <button @click="tab = 'features'" :class="tab === 'features' ? 'text-amber-600 border-b-2 border-amber-500' : ''">
      Features
    </button>
    <button @click="tab = 'pricing'" :class="tab === 'pricing' ? 'text-amber-600 border-b-2 border-amber-500' : ''">
      Pricing
    </button>
    <button @click="tab = 'about'" :class="tab === 'about' ? 'text-amber-600 border-b-2 border-amber-500' : ''">
      About
    </button>
  </nav>

  <div x-show="tab === 'features'" class="mt-4">
    <h3>Features</h3>
    <p>Content for features tab...</p>
  </div>
  <div x-show="tab === 'pricing'" class="mt-4">
    <h3>Pricing</h3>
    <p>Content for pricing tab...</p>
  </div>
  <div x-show="tab === 'about'" class="mt-4">
    <h3>About</h3>
    <p>Content for about tab...</p>
  </div>
</div>
```

### 3. Lazy-Loaded Content with HTMX

Load content only when the user interacts:

```vento
<div
  hx-get="/api/comments"
  hx-trigger="click"
  hx-swap="outerHTML"
  class="cursor-pointer p-4 bg-sand-100 dark:bg-sand-800 rounded-lg"
>
  Click to load comments
</div>
```

### 4. Form Submission without Page Reload

```vento
<form
  hx-post="/api/subscribe"
  hx-target="#subscribe-status"
  hx-swap="innerHTML"
  class="space-y-4"
>
  <input type="email" name="email" placeholder="Your email" required
    class="px-4 py-2 border rounded-lg w-full" />
  <button type="submit"
    class="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
    Subscribe
  </button>
</form>
<div id="subscribe-status"></div>
```

> [!WARNING]
> HTMX requires a server endpoint for dynamic operations. For a fully static site, consider using serverless functions or a third-party service for forms and comments.

## Combining Both Libraries

HTMX and Alpine.js complement each other perfectly. Use Alpine for UI state (open/close, active tab) and HTMX for server communication (fetch, submit, poll):

```vento
<div
  x-data="{ open: false, loading: false }"
  x-init="$watch('open', val => { if (val) loading = true })"
>
  <button @click="open = !open" class="px-4 py-2 bg-sand-900 text-white rounded-lg">
    <span x-show="!open">Show Details</span>
    <span x-show="open">Hide</span>
  </button>

  <div x-show="open" x-transition class="mt-4">
    <div hx-get="/api/details" hx-trigger="load" hx-swap="innerHTML">
      <span x-show="loading">Loading...</span>
    </div>
  </div>
</div>
```

## When to Use Each Approach

- **HTMX** for: form submissions, search, pagination, content loading, server interactions
- **Alpine.js** for: toggles, tabs, modals, dropdowns, client-side validation
- **Both** for: complex UIs that need server interaction AND client state

## Next Steps

Vitto's template-based approach makes it easy to add interactivity exactly where you need it, without paying the cost of a full JavaScript framework everywhere else.

- [HTMX Documentation](https://htmx.org/docs/)
- [Alpine.js Documentation](https://alpinejs.dev/start)
- [Vitto Hooks System](/docs/core/hooks) - Build API endpoints for HTMX
