# Getting Started

This guide will help you create your first Vitto project in minutes.

## Quick Start

The fastest way to start a new Vitto project is using the `create-vitto` scaffolding tool:

### Using NPM

```bash
npm create vitto@latest
```

### Using Yarn

```bash
yarn create vitto
```

### Using PNPM

```bash
pnpm create vitto
```

### Using Bun

```bash
bun create vitto
```

### Using Deno

```bash
deno init --npm vitto
```

Then follow the interactive prompts to configure your project!

## Scaffolding with Templates

You can also directly specify the project name and template:

```bash
# npm 7+ (extra double-dash is needed)
npm create vitto@latest my-website -- --template tailwindcss

# yarn
yarn create vitto my-website --template tailwindcss

# pnpm
pnpm create vitto my-website --template tailwindcss

# Bun
bun create vitto my-website --template tailwindcss

# Deno
deno init --npm vitto my-website --template tailwindcss
```

### Available Templates

- `basic` - Minimal Vitto setup
- `tailwindcss` - Vitto with Tailwind CSS pre-configured

## Manual Installation

If you prefer to add Vitto to an existing Vite project:

### 1. Install Vitto

```bash
# Using pnpm
pnpm add -D vitto

# Using npm
npm install --save-dev vitto

# Using yarn
yarn add --dev vitto
```

### 2. Configure Vite

Create or update your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      minify: process.env.NODE_ENV === 'production',
      enableSearchIndex: true,
    })
  ],
})
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
{{ set pageTitle = "Homepage" }}
{{ layout "layouts/site.vto" }}

<main>
  <h1>{{ pageTitle }}</h1>
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
  <title>{{ pageTitle ? pageTitle : (siteName || 'Vitto') |> safe }}</title>
  {{ renderAssets() |> safe }}
</head>
<body>
  {{ content }}
</body>
</html>
```

### 6. Run Development Server

```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev

# Using yarn
yarn dev

# Using bun
bun dev
```

Open your browser at `http://localhost:5173` to see your site!

### 7. Build for Production

```bash
# Using npm
npm run build

# Using pnpm
pnpm build

# Using yarn
yarn build

# Using bun
bun run build
```

Your static site will be generated in the `dist/` directory.

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
