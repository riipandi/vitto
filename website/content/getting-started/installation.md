# Getting Started

This guide will help you create your first Vitto project in minutes.

## Quick Start

The fastest way to start a new Vitto project is using the `create-vitto` scaffolding tool:

:::tabs
@tab:active npm

```bash
npm create vitto@latest
```

@tab yarn

```bash
yarn create vitto
```

@tab pnpm

```bash
pnpm create vitto
```

@tab bun

```bash
bun create vitto
```

@tab deno

```bash
deno init --npm vitto
```

:::

Then follow the interactive prompts to configure your project!

> [!TIP]
> After the setup completes, run `npm run dev` (or your package manager's equivalent) and open `http://localhost:5173` to see your new site.

## Scaffolding with Templates

You can also directly specify the project name and template:

:::tabs
@tab:active npm

```bash
# npm 7+ (extra double-dash is needed)
npm create vitto@latest my-website -- --template tailwindcss
```

@tab yarn

```bash
yarn create vitto my-website --template tailwindcss
```

@tab pnpm

```bash
pnpm create vitto my-website --template tailwindcss
```

@tab bun

```bash
bun create vitto my-website --template tailwindcss
```

@tab deno

```bash
deno init --npm vitto my-website --template tailwindcss
```

:::

### Available Templates

- `basic` - Minimal Vitto setup
- `tailwindcss` - Vitto with Tailwind CSS pre-configured
- `alpinejs` - Vitto with Alpine.js integration
- `htmx` - Vitto with htmx integration

## Manual Installation

If you prefer to add Vitto to an existing Vite project:

### 1. Install Vitto

:::tabs
@tab:active pnpm

```bash
pnpm add -D vitto
```

@tab npm

```bash
npm install --save-dev vitto
```

@tab yarn

```bash
yarn add --dev vitto
```

:::

### 2. Configure Vite

Create or update your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import vitto from 'vitto';

export default defineConfig({
  plugins: [
    vitto({
      minify: process.env.NODE_ENV === 'production',
      enableSearchIndex: true,
      metadata: {
        siteName: 'Vitto',
        title: 'Vitto - Static Site Generator Powered by Vite & Vento',
      },
    }),
  ],
});
```

### 3. Create Project Structure

Create the following directory structure:

```
my-website/
├── src/
│   ├── pages/           # Your page templates (.vto files)
│   │   └── index.vto    # Homepage
│   ├── layouts/         # Layout templates
│   │   └── base.vto     # Base layout
│   └── partials/        # Reusable components
│       └── header.vto   # Header component
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
└── package.json
```

### 4. Create Your First Page

Create `src/pages/index.vto`:

```vento
{{ layout "layouts/site.vto" }}

{{ setMetadata('title', 'Homepage') }}

<main>
  <h1>{{ title }}</h1>
  <p>{{ description }}</p>
</main>
```

### 5. Create a Layout

Create `src/layouts/base.vto`:

```vento
<!DOCTYPE html>
<html lang="{{ lang || 'en' }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  {{ set pageTitle = metadata.title ? `${metadata.title} - ${metadata.siteName}` : metadata.siteName }}
  <title>{{ pageTitle |> safe }}</title>
  {{ renderAssets() |> safe }}
</head>
<body>
  {{ content }}
</body>
</html>
```

### 6. Run Development Server

:::tabs
@tab:active npm

```bash
npm run dev
```

@tab pnpm

```bash
pnpm dev
```

@tab yarn

```bash
yarn dev
```

@tab bun

```bash
bun dev
```

:::

> [!TIP]
> Open your browser at `http://localhost:5173` to see your site!

### 7. Build for Production

:::tabs
@tab:active npm

```bash
npm run build
```

@tab pnpm

```bash
pnpm build
```

@tab yarn

```bash
yarn build
```

@tab bun

```bash
bun run build
```

:::

> [!NOTE]
> Your static site will be generated in the `dist/` directory.

## Project Structure Explained

### Pages Directory (`src/pages/`)

Contains your page templates. Each `.vto` file becomes an HTML page:

- `index.vto` → `/index.html`
- `about.vto` → `/about.html`
- `blog/post.vto` → `/blog/post.html`

### Layouts Directory (`src/layouts/`)

Contains layout templates that wrap your page content.

### Partials Directory (`src/partials/`)

Contains reusable template components like headers, footers, navigation, etc. Include them in your pages using `{{ include "partials/header.vto" }}`.

### Public Directory (`public/`)

Static assets that are copied as-is to the output directory. Images, fonts, etc.

## Next Steps

Now that you have a basic Vitto site running, explore these topics:

- [Configuration](./03-configuration.md) - Customize Vitto to your needs
- [Templating Guide](./04-templating.md) - Learn Vento templating syntax
- [Dynamic Routes](./05-dynamic-routes.md) - Generate pages from data
- [Hooks System](./06-hooks.md) - Inject dynamic data into templates

## Getting Help

- **Documentation**: You're reading it!
- **GitHub Issues**: [Report bugs or request features](https://github.com/riipandi/vitto/issues)
- **Vento Docs**: [Learn more about Vento](https://vento.js.org)
