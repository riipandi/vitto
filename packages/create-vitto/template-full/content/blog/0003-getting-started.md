---
title: Getting Started Guide
description: How to customize this starter project — add pages, change colors, and deploy.
tags: [demo, guide, setup]
author: John Doe
created: 2025-12-10T09:00:00
slug: getting-started
---

This guide walks through the common tasks you'll do after cloning this starter.

> [!IMPORTANT]
> Before editing any file, run `npm install` (or `pnpm install`) to install dependencies.

## Add a New Page

1. Create a `.md` file in `content/docs/` or `content/blog/`
2. Add frontmatter between `---` delimiters
3. Write your content in markdown

```markdown
---
title: My New Page
description: A brief description
---

Content goes here.
```

The page is automatically available at the corresponding URL path.

## Change the Color Scheme

Open `src/styles/global.css` and update the `@theme` block:

```css
@theme {
  --color-emerald-500: #10b981;
  --color-indigo-500: #6366f1;
}
```

> [!TIP]
> Search for `emerald` and `indigo` across the `src/` directory to find every color reference.

## Enable Search Indexing

Search is handled by Pagefind. During production builds, it automatically indexes your content.

::::tabs
@tab:active Development
Search is **disabled** in dev mode for faster builds.
@tab Production

```bash
npm run build
npm run preview
```

The search index is generated in `dist/_pagefind/`.
::::

## Checklist

- [x] Install dependencies
- [x] Run dev server (`npm run dev`)
- [ ] Customize site name in `vite.config.ts`
- [ ] Replace demo content under `content/`
- [ ] Update footer links and branding
- [ ] Deploy to Cloudflare Pages

> [!NOTE]
> Deployment to Cloudflare Pages is pre-configured. Run `npm run cf:deploy` after building.
