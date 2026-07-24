# Overview

This starter project is built with **Vite** and the **Vento** templating engine. It generates static HTML — no server, no database, no runtime JavaScript overhead.

> [!NOTE]
> Every doc page is a markdown file under `content/docs/`. Add new files to extend the docs.

## Project Structure

```
src/
├── layouts/       # Base templates (base.vto, site.vto, docs.vto)
├── pages/         # Page templates (index.vto, docs.vto, blog.vto, ...)
├── partials/      # Reusable components (header, footer, sidebar, ...)
├── hooks/         # Data hooks (posts.ts, docs.ts)
├── styles/        # Global CSS, markdown, Pagefind, Shiki themes
└── main.ts        # Entry point — dark mode, mobile menu, tabs, copy
```

> [!TIP]
> Vento templates live in `src/`. Content lives in `content/`. This separation keeps structure and data independent.

## Features at a Glance

- Static site generation via Vite + Vento
- Full-text search with Pagefind
- Syntax highlighting with Shiki (dark/light themes)
- Markdown extensions: alerts, tabs, task lists
- Responsive design with Tailwind CSS v4
- Dark mode with system preference detection
- One-click deploy to Cloudflare Pages
