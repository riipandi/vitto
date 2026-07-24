---
title: From Idea to Production - Building a Complete Site with Vitto
description: A step-by-step walkthrough of building a real-world documentation site with Vitto, from project scaffolding to production deployment on Cloudflare Pages.
tags: [vitto, tutorial, workflow, deployment]
author: Aris Ripandi
created: 2026-01-12T10:00:00
updated: 2026-01-15T14:30:00
slug: building-complete-site-vitto
---

Building a static site from scratch can feel overwhelming with all the choices available. This guide walks through creating a production-ready documentation site with Vitto — from zero to deployed.

## Project Setup

Start by scaffolding a new project with the Tailwind CSS template:

```bash
npm create vitto@latest my-docs -- --template tailwindcss
cd my-docs
npm install
npm run dev
```

This gives you a working Vite + Vitto + Tailwind CSS setup in seconds.

## Defining the Structure

A documentation site needs clear information architecture. With Vitto, you organize content as markdown files:

```
content/
├── getting-started/
│   ├── installation.md
│   └── quickstart.md
├── guides/
│   ├── routing.md
│   └── deployment.md
└── reference/
    └── api.md
```

## Adding Search

Vitto ships with Pagefind built in. Enable it in your config:

```ts
vitto({
  enableSearchIndex: true,
  pagefindOptions: {
    rootSelector: 'main',
  },
});
```

That's it. The search index is generated at build time.

## Deployment

Build and deploy to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy dist
```

> [!TIP]
> Vitto outputs pure static HTML. You can deploy to any static hosting: Vercel, Netlify, Cloudflare, or even a basic web server.

## The Result

In under 30 minutes, you have a live documentation site with search, responsive design, and fast builds. That's the power of Vitto — it gets out of your way and lets you focus on content.
