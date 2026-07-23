# Create Vitto

[![npm version](https://img.shields.io/npm/v/create-vitto)](https://www.npmjs.com/package/create-vitto)
[![npm downloads](https://img.shields.io/npm/dm/create-vitto)](https://www.npmjs.com/package/create-vitto)
[![license-mit](https://img.shields.io/badge/License-MIT-greens.svg)][license-mit]

Quickly scaffold your first [Vitto](https://www.npmjs.com/package/vitto) project.

**Compatibility Note:**
Vitto requires [Node.js](https://nodejs.org/en/) version 20.19+.

## Usage

With NPM:

```bash
npm create vitto@latest
```

With Yarn:

```bash
yarn create vitto@latest
```

With PNPM:

```bash
pnpm create vitto@latest
```

With Bun:

```bash
bun create vitto@latest
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
yarn create vitto@latest my-website --template tailwindcss

# pnpm
pnpm create vitto@latest my-website --template tailwindcss

# Bun
bun create vitto@latest my-website --template tailwindcss

# Deno
deno init --npm vitto my-website --template tailwindcss
```

To see a list of all available templates:

```bash
# npm 7+, extra double-dash is needed:
npm create vitto@latest -- --templates

# yarn
yarn create vitto@latest --templates

# pnpm
pnpm create vitto@latest --templates

# Bun
bun create vitto@latest --templates

# Deno
deno init --npm vitto --templates
```

## License

Licensed under the [MIT license][license-mit].

Copyrights in this project are retained by their contributors.

See the [LICENSE][license-mit] file for more information.

[license-mit]: https://github.com/riipandi/vitto/blob/main/LICENSE
