# Quick Start

Get up and running in under a minute.

## Prerequisites

- Node.js 20+ or Bun 1.2+
- A package manager (npm, pnpm, yarn, or bun)

## Installation

```bash
npx create-vitto@latest my-project
cd my-project
npm install
```

> [!TIP]
> Use `pnpm create vitto@latest` or `yarn create vitto` if you prefer those package managers.

## Start Dev Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Changes to markdown files and templates are reflected instantly.

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Preview it locally:

```bash
npm run preview
```

> [!IMPORTANT]
> Search indexing only runs during production builds. To test search, use `npm run build && npm run preview`.

## Project Configuration

Config lives in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import vitto from 'vitto';

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Project',
        title: 'My Project',
        author: 'Your Name',
      },
    }),
  ],
});
```

> [!NOTE]
> See the [Templating](/docs/core/templating) guide for details on layouts, partials, and data injection.
