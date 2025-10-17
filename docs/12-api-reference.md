# API Reference

Complete API documentation for Vitto.

## Table of Contents

- [Plugin Options](#plugin-options)
- [Hooks API](#hooks-api)
- [Template Functions](#template-functions)
- [Configuration Types](#configuration-types)
- [Helper Functions](#helper-functions)

## Plugin Options

### `vitto(options?: VittoOptions)`

The main Vitto plugin function.

```ts
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      // options
    })
  ]
})
```

### VittoOptions

Complete configuration options for the Vitto plugin.

```ts
interface VittoOptions {
  pagesDir?: string
  layoutsDir?: string
  partialsDir?: string
  hooksDir?: string
  minify?: boolean | Partial<MinifyOptions>
  enableSearchIndex?: boolean
  pagefindOptions?: Partial<PagefindServiceConfig>
  outputStrategy?: 'html' | 'directory'
  dynamicRoutes?: DynamicRouteConfig[]
  hooks?: Record<string, HookFunction>
  assets?: { main: string; css: string[] }
  ventoOptions?: Partial<VentoOptions>
}
```

#### `pagesDir`

- **Type**: `string`
- **Default**: `'src/pages'`

Directory containing page templates (`.vto` files).

```ts
vitto({
  pagesDir: 'src/pages'
})
```

#### `layoutsDir`

- **Type**: `string`
- **Default**: `'src/layouts'`

Directory containing layout templates.

```ts
vitto({
  layoutsDir: 'src/layouts'
})
```

#### `partialsDir`

- **Type**: `string`
- **Default**: `'src/partials'`

Directory containing partial templates.

```ts
vitto({
  partialsDir: 'src/partials'
})
```

#### `hooksDir`

- **Type**: `string`
- **Default**: `'hooks'`

Directory containing hook files.

```ts
vitto({
  hooksDir: 'hooks'
})
```

#### `minify`

- **Type**: `boolean | Partial<MinifyOptions>`
- **Default**: `false`

Enable HTML minification. Set to `true` for defaults or pass custom options.

```ts
// Simple boolean
vitto({
  minify: true
})

// Custom options
vitto({
  minify: {
    collapseWhitespaces: 'conservative',
    removeComments: true,
    minifyCss: { lib: 'lightningcss' },
    minifyJs: true
  }
})
```

**MinifyOptions:**

```ts
interface MinifyOptions {
  collapseBooleanAttributes?: boolean
  collapseWhitespaces?: 'none' | 'conservative' | 'aggressive'
  minifyCss?: { lib: 'esbuild' | 'lightningcss' }
  minifyJs?: boolean
  minifyJson?: boolean
  normalizeAttributes?: boolean
  quotes?: boolean
  removeComments?: boolean | 'all' | 'some'
  removeEmptyAttributes?: boolean
  removeEmptyMetadataElements?: boolean
  removeRedundantAttributes?: 'none' | 'some' | 'all'
  selfClosingVoidElements?: boolean
  sortAttributes?: boolean
  sortSpaceSeparatedAttributeValues?: boolean
  tagOmission?: boolean
}
```

#### `enableSearchIndex`

- **Type**: `boolean`
- **Default**: `true`

Enable Pagefind search index generation.

```ts
vitto({
  enableSearchIndex: true
})
```

#### `pagefindOptions`

- **Type**: `Partial<PagefindServiceConfig>`
- **Default**: See below

Configure Pagefind search indexing.

```ts
vitto({
  pagefindOptions: {
    rootSelector: 'main',
    excludeSelectors: ['nav', 'footer'],
    verbose: true
  }
})
```

**PagefindServiceConfig:**

```ts
interface PagefindServiceConfig {
  rootSelector?: string
  excludeSelectors?: string[]
  forceLanguage?: string
  verbose?: boolean
  keepIndexUrl?: boolean
  writePlayground?: boolean
  glob?: string
}
```

#### `outputStrategy`

- **Type**: `'html' | 'directory'`
- **Default**: `'html'`

Output file strategy for generated pages.

- `'html'`: `about.vto` → `about.html` → `/about.html`
- `'directory'`: `about.vto` → `about/index.html` → `/about/`

```ts
vitto({
  outputStrategy: 'directory'
})
```

#### `dynamicRoutes`

- **Type**: `DynamicRouteConfig[]`
- **Default**: `[]`

Configure dynamic route generation.

```ts
vitto({
  dynamicRoutes: [
    {
      template: 'post',
      dataSource: 'posts',
      getParams: (post) => ({ slug: post.slug }),
      getPath: (post) => `blog/${post.slug}.html`
    }
  ]
})
```

**DynamicRouteConfig:**

```ts
interface DynamicRouteConfig {
  template: string
  dataSource: string
  getParams: (item: any) => Record<string, any>
  getPath: (item: any) => string
}
```

#### `hooks`

- **Type**: `Record<string, HookFunction>`
- **Default**: `{}`

Register hook functions for data injection.

```ts
import { defineHooks } from 'vitto'

const postsHook = defineHooks('posts', async () => {
  return await fetchPosts()
})

vitto({
  hooks: {
    posts: postsHook
  }
})
```

**HookFunction:**

```ts
type HookFunction<T = any, P = any> = (params?: P) => T | Promise<T>
```

#### `assets`

- **Type**: `{ main: string; css: string[] }`
- **Default**: Auto-generated

Override Vite-generated assets. Rarely needed.

```ts
vitto({
  assets: {
    main: 'assets/main.js',
    css: ['assets/style.css']
  }
})
```

#### `ventoOptions`

- **Type**: `Partial<VentoOptions>`
- **Default**: `{}`

Pass custom options to Vento template engine.

```ts
vitto({
  ventoOptions: {
    autoescape: true,
    includes: ['custom/includes']
  }
})
```

## Hooks API

### `defineHooks(name, handler)`

Define a hook function for data injection.

```ts
function defineHooks<T = any, P = any>(
  name: string,
  handler: (params?: P) => T | Promise<T>
): HookFunction<T, P>
```

**Parameters:**

- `name` - Hook identifier (used in templates and config)
- `handler` - Function that returns data (can be async)

**Returns:** Hook function that can be registered

**Example:**

```ts
import { defineHooks } from 'vitto'

// Static hook
export const siteHook = defineHooks('site', () => {
  return {
    name: 'My Site',
    url: 'https://example.com'
  }
})

// Async hook
export const postsHook = defineHooks('posts', async () => {
  const response = await fetch('https://api.example.com/posts')
  return await response.json()
})

// Parameterized hook
export const postHook = defineHooks('post', async (params) => {
  const response = await fetch(`https://api.example.com/posts/${params.id}`)
  return await response.json()
})
```

**Type Parameters:**

- `T` - Return type of the hook
- `P` - Parameter type (optional)

**TypeScript Example:**

```ts
interface Post {
  id: number
  title: string
  content: string
}

interface PostParams {
  id: number
}

export const postHook = defineHooks<Post, PostParams>('post', async (params) => {
  if (!params?.id) {
    throw new Error('ID is required')
  }

  const response = await fetch(`/api/posts/${params.id}`)
  return await response.json()
})
```

## Template Functions

Functions available in Vento templates.

### `renderAssets()`

Injects Vite-generated CSS and JavaScript assets.

**Returns:** `string` - HTML script and link tags

**Usage:**

```vento
<head>
  {{ renderAssets() |> safe }}
</head>
```

**Output (Development):**

```html
<script type="module" src="/@vite/client"></script>
<script type="module" src="/src/main.ts"></script>
```

**Output (Production):**

```html
<link rel="stylesheet" href="/assets/style-abc123.css">
<script type="module" src="/assets/main-def456.js"></script>
```

### `include(path, data?)`

Include a partial template.

**Parameters:**

- `path` - Path to partial (relative to `partialsDir`)
- `data` - Optional data to pass to partial

**Usage:**

```vento
{{ include "partials/header.vto" }}

{{ include "partials/card.vto" {
  title: "Card Title",
  content: "Card content"
} }}
```

## Configuration Types

### DynamicRouteConfig

Configuration for dynamic route generation.

```ts
interface DynamicRouteConfig {
  template: string                                // Template name (without .vto)
  dataSource: string                              // Hook name providing data array
  getParams: (item: any) => Record<string, any>  // Extract params for hook
  getPath: (item: any) => string                 // Generate output file path
}
```

**Example:**

```ts
{
  template: 'post',
  dataSource: 'posts',
  getParams: (post) => ({
    slug: post.slug,
    id: post.id
  }),
  getPath: (post) => `blog/${post.slug}.html`
}
```

### PagefindServiceConfig

Pagefind search configuration.

```ts
interface PagefindServiceConfig {
  rootSelector?: string        // Element to index (default: 'html')
  excludeSelectors?: string[]  // Selectors to exclude from indexing
  forceLanguage?: string       // Force specific language
  verbose?: boolean            // Enable verbose logging
  keepIndexUrl?: boolean       // Keep index URL structure
  writePlayground?: boolean    // Generate playground (dev only)
  glob?: string               // Glob pattern for files to process
}
```

**Example:**

```ts
{
  rootSelector: 'main',
  excludeSelectors: ['nav', 'footer', '.sidebar'],
  verbose: true,
  keepIndexUrl: true
}
```

### MinifyOptions

HTML minification options.

```ts
interface MinifyOptions {
  collapseBooleanAttributes?: boolean
  collapseWhitespaces?: 'none' | 'conservative' | 'aggressive'
  minifyCss?: {
    lib: 'esbuild' | 'lightningcss'
  }
  minifyJs?: boolean
  minifyJson?: boolean
  normalizeAttributes?: boolean
  quotes?: boolean
  removeComments?: boolean | 'all' | 'some'
  removeEmptyAttributes?: boolean
  removeEmptyMetadataElements?: boolean
  removeRedundantAttributes?: 'none' | 'some' | 'all'
  selfClosingVoidElements?: boolean
  sortAttributes?: boolean
  sortSpaceSeparatedAttributeValues?: boolean
  tagOmission?: boolean
}
```

**Defaults:**

```ts
{
  collapseBooleanAttributes: true,
  collapseWhitespaces: 'conservative',
  minifyCss: { lib: 'lightningcss' },
  minifyJs: true,
  minifyJson: true,
  normalizeAttributes: true,
  quotes: true,
  removeComments: false,
  removeEmptyAttributes: false,
  removeEmptyMetadataElements: false,
  removeRedundantAttributes: 'all',
  selfClosingVoidElements: false,
  sortAttributes: true,
  sortSpaceSeparatedAttributeValues: true,
  tagOmission: true
}
```

## Helper Functions

### Template Context

Objects available in all templates.

#### `viteAssets`

Object containing individual asset paths.

```ts
interface ViteAssets {
  main: string      // Main JavaScript entry
  css: string[]     // Array of CSS files
}
```

**Usage:**

```vento
{{# Manual asset injection #}}
<script type="module" src="{{ viteAssets.main }}"></script>

{{ for css of viteAssets.css }}
  <link rel="stylesheet" href="{{ css }}">
{{ /for }}
```

#### Hook Data

All registered hooks are available by their name.

```vento
{{# From hooks: { site: siteHook, posts: postsHook } #}}

{{ site.name }}
{{ site.url }}

{{ for post of posts }}
  {{ post.title }}
{{ /for }}
```

## Vento Filters

Built-in Vento filters available in templates.

### `safe`

Renders HTML without escaping.

```vento
{{ htmlContent |> safe }}
```

### `uppercase`

Converts to uppercase.

```vento
{{ title |> uppercase }}
```

### `lowercase`

Converts to lowercase.

```vento
{{ text |> lowercase }}
```

### `trim`

Removes whitespace.

```vento
{{ text |> trim }}
```

### `json`

Converts to JSON string.

```vento
{{ data |> json }}
```

### `replace`

Replaces text.

```vento
{{ text |> replace("old", "new") }}
```

## Environment Variables

Access environment variables in templates and config.

### In Templates

```vento
{{ if env.NODE_ENV === 'production' }}
  <script src="analytics.js"></script>
{{ /if }}
```

### In Configuration

```ts
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    vitto({
      minify: mode === 'production',
      enableSearchIndex: mode === 'production'
    })
  ]
}))
```

### In Hooks

```ts
export default defineHooks('config', () => {
  return {
    apiUrl: process.env.VITE_API_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV
  }
})
```

## Type Exports

Types exported from the Vitto package.

```ts
import type {
  VittoOptions,
  DynamicRouteConfig,
  PagefindServiceConfig,
  MinifyOptions,
  HookFunction
} from 'vitto'
```

## Example: Complete Type-Safe Configuration

```ts
import { defineConfig } from 'vite'
import vitto, { defineHooks } from 'vitto'
import type { VittoOptions, DynamicRouteConfig } from 'vitto'

// Type-safe hook
interface Post {
  id: number
  slug: string
  title: string
  content: string
}

const postsHook = defineHooks<Post[]>('posts', async () => {
  const posts: Post[] = await fetchPosts()
  return posts
})

// Type-safe dynamic routes
const dynamicRoutes: DynamicRouteConfig[] = [
  {
    template: 'post',
    dataSource: 'posts',
    getParams: (post: Post) => ({ slug: post.slug }),
    getPath: (post: Post) => `blog/${post.slug}.html`
  }
]

// Type-safe plugin options
const vittoOptions: VittoOptions = {
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  minify: true,
  enableSearchIndex: true,
  hooks: {
    posts: postsHook
  },
  dynamicRoutes
}

export default defineConfig({
  plugins: [vitto(vittoOptions)]
})
```

## CLI Commands

Commands available when using Vitto.

### Development

```bash
npm run dev
```

Starts Vite development server with hot module replacement.

### Build

```bash
npm run build
```

Builds the site for production:
1. Compiles templates
2. Processes assets
3. Minifies HTML (if enabled)
4. Generates search index (if enabled)

### Preview

```bash
npm run preview
```

Previews production build locally.

## Next Steps

- [Examples](./10-examples.md) - Real-world usage examples
- [Troubleshooting](./11-troubleshooting.md) - Common issues
- [Contributing](./13-contributing.md) - Contribute to Vitto
