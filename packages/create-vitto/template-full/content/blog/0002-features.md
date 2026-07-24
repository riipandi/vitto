---
title: Markdown Features Guide
description: See every content block in action — tabs, alerts, tables, and syntax highlighting.
tags: [demo, markdown, features]
author: John Doe
created: 2025-12-05T09:00:00
slug: features
---

This page demonstrates every supported markdown extension. Use it as a reference when writing your own content.

## Alerts

GitHub Flavored Markdown alerts — rendered as colored blocks.

> [!NOTE]
> Useful for neutral information that users shouldn't miss.

> [!TIP]
> Best practice: keep alert content short and scannable.

> [!IMPORTANT]
> This template uses `@mdit/plugin-alert` for rendering.

> [!WARNING]
> Alert titles are auto-styled. No extra markup needed.

> [!CAUTION]
> Potential pitfalls go here. Use sparingly.

## Tabbed Content

Tabs let you group related content — perfect for multi-language code or alternative instructions.

::::tabs
@tab:active Tab A
Content for the first tab. Click "Tab B" to switch.
@tab Tab B
Content for the second tab. Each tab is independent.
@tab Tab C
A third tab for additional examples.
::::

Tabs can also hold code blocks:

::::tabs
@tab:active npm

```bash
npx create-vitto@latest my-project
cd my-project
npm run dev
```

@tab pnpm

```bash
pnpm create vitto@latest my-project
cd my-project
pnpm dev
```

@tab yarn

```bash
yarn create vitto
cd my-project
yarn dev
```

::::

## Tables

Tables are wrapped in a scrollable container on mobile.

| Feature           | Status | Notes                                  |
| ----------------- | ------ | -------------------------------------- |
| Alerts            | ✅     | Note, tip, warning, caution, important |
| Tabs              | ✅     | Nested content blocks                  |
| Task lists        | ✅     | Interactive checkboxes                 |
| Code highlighting | ✅     | Shiki with multiple themes             |

## Task Lists

- [x] Alerts styled and working
- [x] Tabs switching correctly
- [x] Tables scrollable on mobile
- [ ] Write actual site content
- [ ] Deploy to production
