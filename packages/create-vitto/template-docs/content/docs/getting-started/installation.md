# Installation

## Quick Start

Create a new project:

```bash
npm create vitto@latest my-docs
cd my-docs
npm run dev
```

## Manual Setup

Add Vitto to an existing project:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vitto from 'vitto';

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site',
      },
    }),
  ],
});
```
