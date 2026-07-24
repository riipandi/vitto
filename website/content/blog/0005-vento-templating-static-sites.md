---
title: Vento Templating - Why It's the Perfect Fit for Static Sites
description: Vento offers a refreshing alternative to JSX, template literals, and other templating approaches. Here's why it works so well with Vitto.
tags: [vento, templating, javascript, web-development]
author: Aris Ripandi
created: 2026-01-28T09:00:00
updated: 2026-01-30T16:00:00
slug: vento-templating-static-sites
---

When building static sites, the templating engine you choose shapes your entire development experience. Vitto uses [Vento](https://vento.js.org), and here's why that matters.

## What is Vento?

Vento is a modern templating engine that compiles templates to JavaScript functions. It's fast, expressive, and designed for HTML.

```vento
{{ layout "layouts/base.vto" }}

<main>
  <h1>{{ title }}</h1>
  {{ if showContent }}
    <p>{{ description }}</p>
  {{ /if }}
</main>
```

## Why Vento Over JSX?

JSX is powerful, but it comes with baggage:

- Requires a build step (Babel or equivalent)
- Mixes logic and presentation heavily
- Tightly coupled to React or similar frameworks

Vento keeps things simpler:

- No build step beyond what Vite already provides
- Clean separation of logic and markup
- Framework-agnostic — use with any JS library

## Filters and Pipes

Vento supports filter pipelines for transforming data:

```vento
{{ title |> uppercase }}
{{ date |> formatDate }}
{{ content |> safe }}
```

You can create custom filters too — just JavaScript functions.

## Layouts and Includes

Compose pages using layouts and partials:

```vento
{{ layout "layouts/base.vto" }}
{{ include "partials/header.vto" }}
{{ content }}
{{ include "partials/footer.vto" }}
```

## Performance

Vento compiles templates to optimized JavaScript functions. The overhead is minimal — often less than 1ms per render. For static sites (rendered at build time), this means zero runtime cost.

> [!TIP]
> Because Vitto pre-renders everything at build time, the template engine's speed doesn't affect your users — only your build time.
