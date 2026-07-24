---
title: Optimizing Core Web Vitals for Static Sites
description: Practical strategies for achieving excellent Lighthouse scores with your Vitto site — from image optimization to efficient CSS delivery.
tags: [performance, web-vitals, optimization, tutorial]
author: Aris Ripandi
created: 2026-03-10T09:00:00
updated: 2026-03-12T15:00:00
slug: optimizing-core-web-vitals
---

Core Web Vitals are Google's metrics for user experience. Static sites have a natural advantage, but there's still room for optimization.

## The Three Metrics

| Metric                              | Target  | What It Measures |
| ----------------------------------- | ------- | ---------------- |
| **LCP** (Largest Contentful Paint)  | < 2.5s  | Loading speed    |
| **INP** (Interaction to Next Paint) | < 200ms | Interactivity    |
| **CLS** (Cumulative Layout Shift)   | < 0.1   | Visual stability |

## Why Static Sites Win

Pre-built HTML served from a CDN is the fastest way to deliver content. Vitto sites start with:

- **Zero server-side processing** — HTML is already built
- **Minimal JavaScript** — no framework overhead by default
- **CDN-ready output** — deploy to the edge

## Optimizing LCP

### 1. Optimize Images

```vento
<img src="/images/hero.webp"
  width="1200" height="600"
  loading="eager"
  class="rounded-lg"
  alt="Hero image">
```

Use modern formats (WebP, AVIF) and explicit dimensions to prevent layout shift.

### 2. Efficient CSS Delivery

Tailwind CSS v4 automatically purges unused styles. Your production CSS is as small as possible.

```bash
# Production build with minification
NODE_ENV=production npm run build
```

## Optimizing CLS

### 1. Set Explicit Dimensions

Every image, video, and embedded element needs explicit `width` and `height`:

```css
img,
video,
iframe {
  max-width: 100%;
  height: auto;
}
```

### 2. Reserve Space for Dynamic Content

When using hooks to inject data, ensure the layout doesn't shift by reserving space:

```vento
<div style="min-height: 200px">
  {{ if posts }}
    {{ for post of posts }}
      <!-- Post card -->
    {{ /for }}
  {{ /if }}
</div>
```

## Optimizing INP

### 1. Defer Non-Critical JavaScript

```html
<script defer src="/assets/main.js"></script>
```

### 2. Use requestIdleCallback for Analytics

```ts
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => loadAnalytics());
} else {
  setTimeout(loadAnalytics, 1000);
}
```

## Measuring Performance

Use these tools to track your scores:

- [PageSpeed Insights](https://pagespeed.web.dev/)
- Lighthouse (built into Chrome DevTools)
- Web Vitals browser extension

> [!IMPORTANT]
> The best performance optimization is shipping less JavaScript. Vitto's zero-JS-by-default approach gives you a head start on every metric.

## Checklist

- [x] Enable HTML minification in production
- [x] Optimize images (WebP, responsive sizes)
- [x] Set explicit width/height on media elements
- [x] Defer non-critical scripts
- [x] Use CDN for delivery
- [x] Enable search index only in production
