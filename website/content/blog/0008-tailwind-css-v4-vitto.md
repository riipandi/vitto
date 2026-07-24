---
title: Tailwind CSS v4 with Vitto - A Match Made in Heaven
description: Tailwind CSS v4 brings a new engine, CSS-first configuration, and better performance. Here's how it integrates with Vitto.
tags: [tailwindcss, css, styling, vitto]
author: Aris Ripandi
created: 2026-03-02T14:00:00
updated: 2026-03-05T10:30:00
slug: tailwind-css-v4-vitto
---

Tailwind CSS v4 is a major evolution of the popular utility-first framework. Vitto has supported it since day one.

## Setup

Add Tailwind CSS v4 to your Vitto project:

```bash
npm install tailwindcss @tailwindcss/vite
```

Then register the plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vitto from 'vitto';

export default defineConfig({
  plugins: [vitto({ metadata: { siteName: 'My Site', title: 'My Site' } }), tailwindcss()],
});
```

Import Tailwind in your main CSS file:

```css
@import 'tailwindcss';
```

## What's New in v4

### CSS-First Configuration

Gone is the `tailwind.config.js` file. Configuration happens in CSS:

```css
@theme {
  --color-brand: #ff5733;
  --font-display: 'Inter', sans-serif;
  --breakpoint-xs: 30rem;
}
```

### The `@apply` Directive

```css
.btn-primary {
  @apply px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors;
}
```

### Custom Utilities with `@utility`

```css
@utility text-gradient {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-violet-500;
}
```

## Integration Benefits

Vitto + Tailwind CSS v4 gives you:

- [x] **No config file** — theme in CSS, not JavaScript
- [x] **Faster builds** — v4's new engine is significantly faster
- [x] **Smaller CSS** — automatic tree-shaking of unused utilities
- [x] **CSS variables** — all theme values are CSS custom properties
- [x] **`color-mix()` support** — create variations without defining every shade

## Example

```css
@import 'tailwindcss';

@theme {
  --color-sand-50: #faf9f6;
  --color-sand-100: #f3f1eb;
  --color-amber-500: #f59e0b;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

@layer base {
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
  }
}
```

This is exactly how Vitto's own documentation site is styled.

> [!TIP]
> Tailwind CSS v4's `@theme` directive makes it easy to maintain a consistent design system across your Vitto site. Define your colors, fonts, and spacing once, use them everywhere.
