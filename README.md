# Vitto

[![npm version](https://img.shields.io/npm/v/vitto)](https://www.npmjs.com/package/vitto)
[![npm downloads](https://img.shields.io/npm/dm/vitto)](https://www.npmjs.com/package/vitto)
[![license-mit](https://img.shields.io/badge/License-MIT-greens.svg)][license-mit]

Vite plugin for generating a static site using the [Vento](https://vento.js.org) templating engine.

**Compatibility Note:**
Vitto requires [Node.js](https://nodejs.org/en/) version 20.19+, 22.12+.

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

## License

Licensed under the [MIT license][license-mit].

Copyrights in this project are retained by their contributors.

See the [LICENSE][license-mit] file for more information.

[license-mit]: https://github.com/riipandi/vitto/blob/main/LICENSE
