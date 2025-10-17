# Vitto

[![npm version](https://img.shields.io/npm/v/vitto)](https://www.npmjs.com/package/vitto)
[![npm downloads](https://img.shields.io/npm/dm/vitto)](https://www.npmjs.com/package/vitto)
[![license-mit](https://img.shields.io/badge/License-MIT-greens.svg)][license-mit]

Vite plugin for generating a static site using the [Vento](https://vento.js.org) templating engine.

**Compatibility Note:**
Vitto requires [Node.js](https://nodejs.org/en/) version 20.19+, 22.12+.

## Features

- 🚀 **Fast Development** - Powered by Vite's lightning-fast HMR
- 📝 **Vento Templates** - Simple and powerful templating with Vento
- 🔍 **Built-in Search** - Integrated Pagefind for static search
- 🎨 **Flexible Styling** - Use any CSS framework (Tailwind, UnoCSS, etc.)
- 🗂️ **Dynamic Routes** - Generate pages from data sources
- 🪝 **Hooks System** - Inject data into templates with ease
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🏗️ **Static Output** - Generate fully static sites for any hosting

## Quick Start

With NPM:

```bash
npm create vitto@latest
```

With Yarn:

```bash
yarn create vitto
```

With PNPM:

```bash
pnpm create vitto
```

With Bun:

```bash
bun create vitto
```

With Deno:

```bash
deno init --npm vitto
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional
command line options. For example, to scaffold a Vitto + Tailwind CSS project, run:

```bash
# npm 7+, extra double-dash is needed:
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

## Manual Installation

```sh
# Install with pnpm
pnpm add -D vitto

# Install with npm
npm install --save-dev vitto

# Install with yarn
yarn add --dev vitto
```

## Usage

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


## Documentation

For comprehensive documentation, visit our [docs folder](./docs) or check out these guides:

### Getting Started
- [Getting Started](./docs/01-getting-started.md) - Installation and basic setup
- [Configuration](./docs/02-configuration.md) - Configure Vitto for your project

### Core Concepts
- [Templates](./docs/03-templates.md) - Working with Vento templates
- [Layouts & Partials](./docs/04-layouts-partials.md) - Reusable template components
- [Dynamic Routes](./docs/05-dynamic-routes.md) - Generate pages from data
- [Hooks System](./docs/06-hooks.md) - Data injection and processing

### Advanced Features
- [Search Integration](./docs/07-search.md) - Set up Pagefind search
- [Deployment](./docs/08-deployment.md) - Deploy to various platforms
- [Performance](./docs/09-performance.md) - Optimize your site

### Reference
- [Examples](./docs/10-examples.md) - Real-world examples and use cases
- [Troubleshooting](./docs/11-troubleshooting.md) - Common issues and solutions
- [API Reference](./docs/12-api-reference.md) - Complete API documentation
- [Contributing](./docs/13-contributing.md) - Contribute to Vitto

## Community

- [GitHub Discussions](https://github.com/riipandi/vitto/discussions) - Ask questions and discuss
- [GitHub Issues](https://github.com/riipandi/vitto/issues) - Report bugs and request features
<!-- - [Discord](https://discord.gg/vitto) - Join our community (coming soon) -->

## Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/13-contributing.md) for details.

## License

Licensed under the [MIT license][license-mit].

Copyrights in this project are retained by their contributors.

See the [LICENSE][license-mit] file for more information.

[license-mit]: https://github.com/riipandi/vitto/blob/main/LICENSE
