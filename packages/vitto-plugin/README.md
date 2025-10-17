# Vitto

[![npm version](https://img.shields.io/npm/v/vitto)](https://www.npmjs.com/package/vitto)
[![npm downloads](https://img.shields.io/npm/dm/vitto)](https://www.npmjs.com/package/vitto)
[![license-mit](https://img.shields.io/badge/License-MIT-greens.svg)][license-mit]

Vite plugin for generating a static site using the Vento templating engine.

Visit the [project page](https://github.com/riipandi/vitto) for more detailed information.

## Installation

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
