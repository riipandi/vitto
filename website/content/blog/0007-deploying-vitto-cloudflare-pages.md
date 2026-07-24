---
title: Deploying Vitto Sites to Cloudflare Pages - A Complete Guide
description: Step-by-step instructions for deploying your Vitto site to Cloudflare Pages, including environment variables, custom domains, and CI/CD setup.
tags: [vitto, deployment, cloudflare, tutorial]
author: Aris Ripandi
created: 2026-02-18T08:00:00
updated: 2026-02-20T12:00:00
slug: deploying-vitto-cloudflare-pages
---

Cloudflare Pages is one of the fastest and most affordable ways to host a static site. Here's how to deploy Vitto sites to it.

## Why Cloudflare Pages?

| Feature            | Cloudflare Pages        | Netlify             | Vercel          |
| ------------------ | ----------------------- | ------------------- | --------------- |
| **Global CDN**     | 330+ cities             | 300+ cities         | 100+ cities     |
| **Bandwidth**      | Unlimited               | 100GB/mo (free)     | 100GB/mo (free) |
| **Build minutes**  | 500/mo (free)           | 300/mo (free)       | 6000/mo (free)  |
| **Custom domains** | 10 (free)               | Unlimited           | Unlimited       |
| **Workers**        | Built-in (100k req/day) | Functions (125k/mo) | Edge Functions  |

## Prerequisites

- A Vitto project ready to deploy
- A Cloudflare account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)

## Setup

### 1. Configure Your Vitto Project

Ensure your `vite.config.ts` is ready for production:

```ts
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    vitto({
      minify: isProduction,
      enableSearchIndex: true,
    }),
  ],
  build: {
    minify: isProduction,
  },
});
```

### 2. Connect to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy (first time)
wrangler pages deploy dist --project-name my-vitto-site
```

### 3. Configure Build Settings

In the Cloudflare Dashboard, set:

| Setting            | Value                                  |
| ------------------ | -------------------------------------- |
| **Build command**  | `npm run build`                        |
| **Build output**   | `dist`                                 |
| **Root directory** | (leave blank or set to website subdir) |

### 4. Set Environment Variables

For production, add these in Cloudflare Dashboard > Environment Variables:

- `NODE_ENV`: `production`
- `NODE_VERSION`: (your Node version, e.g. `22`)

> [!TIP]
> Use `wrangler pages deploy --branch production` to deploy from CI/CD pipelines like GitHub Actions.

## Custom Domain

```bash
wrangler pages domain set my-vitto-site example.com
```

Or configure it in the Cloudflare Dashboard under Pages > your project > Custom domains.

## Continuous Deployment

Connect your Git repository to Cloudflare Pages. Every push to the main branch triggers a new build and deployment automatically.

## Post-Deployment Checklist

- [x] Verify search works (Ctrl+K / Cmd+K)
- [x] Check all internal links
- [x] Test page load speed
- [x] Verify SSL certificate is active
- [x] Test on mobile devices

## Troubleshooting

| Issue                  | Solution                                                     |
| ---------------------- | ------------------------------------------------------------ |
| **404 on page reload** | Ensure `wrangler.jsonc` has correct `pages_build_output_dir` |
| **Search not working** | Verify `enableSearchIndex: true` and rebuild                 |
| **Assets not loading** | Check base path configuration in `vite.config.ts`            |
