# API Reference

Complete API documentation for Vitto.

## Table of Contents

- [Plugin Options](#plugin-options)
- [Hooks API](#hooks-api)
- [Template Functions](#template-functions)
- [Configuration Types](#configuration-types)
- [Helper Functions](#helper-functions)

## Plugin Options

### `vitto(options: VittoOptions)`

The main Vitto plugin function.

```ts
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      }
      // other options
    })
  ]
})
```

### VittoOptions

Complete configuration options for the Vitto plugin.

```ts
interface VittoOptions {
  metadata: Metadata
  pagesDir?: string
  layoutsDir?: string
  partialsDir?: string
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

#### `metadata` (Required)

- **Type**: `Metadata`
- **Required**: Yes

Site metadata to inject into all page templates.

```ts
interface Metadata {
  siteName: string                    // Required: Site name
  title: string                       // Required: Default page title
  description?: string                // Optional: Site description
  keywords?: string[] | string        // Optional: SEO keywords
  author?: string                     // Optional: Site author
  language?: string                   // Optional: Site language
  [key: string]: any                  // Optional: Any custom metadata
}
```

**Example:**

```ts
vitto({
  metadata: {
    siteName: 'My Awesome Site',
    title: 'Welcome to My Site',
    description: 'A website built with Vitto',
    keywords: ['vitto', 'static-site', 'vite'],
    author: 'John Doe',
    language: 'en',
    // Custom metadata
    social: {
      twitter: '@johndoe',
      github: 'johndoe'
    },
    theme: {
      primaryColor: '#007bff',
      darkMode: true
    }
  }
})
```

**Access in Templates:**

```vento
<title>{{ metadata.title }}</title>
<meta name="description" content="{{ metadata.description }}">
<meta name="author" content="{{ metadata.author }}">
<html lang="{{ metadata.language }}">

{{# Access custom metadata #}}
<a href="https://twitter.com/{{ metadata.social.twitter }}">Twitter</a>
```

#### `pagesDir`

- **Type**: `string`
- **Default**: `'src/pages'`

Directory containing page templates (`.vto` files).

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  pagesDir: 'src/pages'
})
```

#### `layoutsDir`

- **Type**: `string`
- **Default**: `'src/layouts'`

Directory containing layout templates.

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  layoutsDir: 'src/layouts'
})
```

#### `partialsDir`

- **Type**: `string`
- **Default**: `'src/partials'`

Directory containing partial templates.

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  partialsDir: 'src/partials'
})
```

#### `minify`

- **Type**: `boolean | Partial<MinifyOptions>`
- **Default**: `false`

Enable HTML minification. Set to `true` for defaults or pass custom options.

```ts
// Simple boolean
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  minify: true
})

// Custom options
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
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

**Default MinifyOptions:**

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

#### `enableSearchIndex`

- **Type**: `boolean`
- **Default**: `true`

Enable Pagefind search index generation during build.

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  enableSearchIndex: true
})
```

#### `pagefindOptions`

- **Type**: `Partial<PagefindServiceConfig>`
- **Default**: See below

Configure Pagefind search indexing.

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
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
  rootSelector?: string        // Element to index (default: 'html')
  excludeSelectors?: string[]  // Selectors to exclude from indexing
  forceLanguage?: string       // Force specific language
  verbose?: boolean            // Enable verbose logging
  keepIndexUrl?: boolean       // Keep index URL structure
  writePlayground?: boolean    // Generate playground (dev only)
  glob?: string               // Glob pattern for files to process
}
```

**Default PagefindOptions:**

```ts
{
  rootSelector: 'html',
  writePlayground: false,
  keepIndexUrl: true,
  verbose: false
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
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  outputStrategy: 'directory'
})
```

#### `dynamicRoutes`

- **Type**: `DynamicRouteConfig[]`
- **Default**: `[]`

Configure dynamic route generation.

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
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
  template: string                                // Template name (without .vto)
  dataSource: string                              // Hook name providing data array
  getParams: (item: any) => Record<string, any>   // Extract params for hook
  getPath: (item: any) => string                  // Generate output file path
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
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
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
- **Default**: Auto-generated by Vite

Override Vite-generated assets. Rarely needed.

```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
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
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  ventoOptions: {
    autoescape: true,
    includes: ['custom/includes'],
    filters: {
      customFilter: (value) => value.toUpperCase()
    }
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
  if (!params?.id) {
    throw new Error('ID is required')
  }

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
  slug: string
  date: string
}

interface PostParams {
  slug: string
}

export const postHook = defineHooks<Post, PostParams>('post', async (params) => {
  if (!params?.slug) {
    throw new Error('Slug is required')
  }

  const response = await fetch(`/api/posts/${params.slug}`)
  const post: Post = await response.json()
  return post
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

### `layout(path)`

Set the layout for a page.

**Parameters:**

- `path` - Path to layout file (relative to `layoutsDir`)

**Usage:**

```vento
{{ layout "layouts/base.vto" }}

<h1>Page Content</h1>
```

## Configuration Types

### Metadata

Site metadata configuration.

```ts
interface Metadata {
  siteName: string               // Required: Site name
  title: string                  // Required: Default page title
  description?: string           // Optional: Site description
  keywords?: string[] | string   // Optional: SEO keywords
  author?: string                // Optional: Site author
  language?: string              // Optional: Site language (e.g., 'en', 'es')
  [key: string]: any             // Optional: Custom metadata fields
}
```

**Example:**

```ts
const metadata: Metadata = {
  siteName: 'Tech Blog',
  title: 'Tech Blog - Latest Articles',
  description: 'A blog about web development and technology',
  keywords: ['web development', 'javascript', 'typescript'],
  author: 'Jane Smith',
  language: 'en',
  // Custom fields
  social: {
    twitter: '@techblog',
    github: 'techblog'
  },
  analytics: {
    googleAnalytics: 'UA-XXXXX-Y'
  }
}
```

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
  rootSelector?: string         // Element to index (default: 'html')
  excludeSelectors?: string[]   // Selectors to exclude from indexing
  forceLanguage?: string        // Force specific language
  verbose?: boolean             // Enable verbose logging
  keepIndexUrl?: boolean        // Keep index URL structure
  writePlayground?: boolean     // Generate playground (dev only)
  glob?: string                 // Glob pattern for files to process
}
```

**Example:**

```ts
{
  rootSelector: 'main',
  excludeSelectors: ['nav', 'footer', '.sidebar', '.comments'],
  forceLanguage: 'en',
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

Objects and data available in all templates.

#### `metadata`

Site metadata object (always available).

```vento
{{# Access metadata #}}
<title>{{ metadata.title }}</title>
<meta name="description" content="{{ metadata.description }}">
<meta name="author" content="{{ metadata.author }}">
<html lang="{{ metadata.language }}">

{{# Access custom metadata #}}
<a href="https://twitter.com/{{ metadata.social.twitter }}">Follow us</a>
```

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
{{ renderAssets() |> safe }}
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
<script>
  const data = {{ data |> json |> safe }};
</script>
```

### `replace`

Replaces text.

```vento
{{ text |> replace("old", "new") }}
{{ slug |> replace(" ", "-") }}
```

## Environment Variables

Access environment variables in templates and config.

### In Templates

```vento
{{ if env.NODE_ENV === 'production' }}
  <script src="analytics.js"></script>
{{ /if }}

{{ if env.VITE_FEATURE_FLAG === 'true' }}
  <div class="new-feature">...</div>
{{ /if }}
```

### In Configuration

```ts
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      },
      minify: mode === 'production',
      enableSearchIndex: mode === 'production',
      pagefindOptions: {
        verbose: mode === 'development'
      }
    })
  ]
}))
```

### In Hooks

```ts
export default defineHooks('config', () => {
  return {
    apiUrl: process.env.VITE_API_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV,
    debug: process.env.NODE_ENV === 'development'
  }
})
```

## Type Exports

Types exported from the Vitto package.

```ts
import type {
  VittoOptions,
  Metadata,
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
import type { VittoOptions, DynamicRouteConfig, Metadata } from 'vitto'

// Type-safe metadata
const metadata: Metadata = {
  siteName: 'Tech Blog',
  title: 'Tech Blog - Latest Articles',
  description: 'A blog about web development',
  keywords: ['blog', 'web development', 'javascript'],
  author: 'Jane Doe',
  language: 'en',
  social: {
    twitter: '@techblog',
    github: 'techblog'
  }
}

// Type-safe hook
interface Post {
  id: number
  slug: string
  title: string
  content: string
  date: string
  author: string
}

const postsHook = defineHooks<Post[]>('posts', async () => {
  const posts: Post[] = await fetchPosts()
  return posts
})

const postHook = defineHooks<Post | null, { slug: string }>('post', async (params) => {
  if (!params?.slug) return null

  const post: Post | undefined = await fetchPost(params.slug)
  return post || null
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
  metadata,
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  partialsDir: 'src/partials',
  minify: process.env.NODE_ENV === 'production',
  enableSearchIndex: true,
  outputStrategy: 'directory',
  hooks: {
    posts: postsHook,
    post: postHook
  },
  dynamicRoutes,
  pagefindOptions: {
    rootSelector: 'main',
    verbose: false
  }
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

**Note**: Search functionality is not available in development mode. Build the site to test search.

### Build

```bash
npm run build
```

Builds the site for production:
1. Compiles templates
2. Processes assets with Vite
3. Generates dynamic routes
4. Minifies HTML (if enabled)
5. Generates search index (if enabled)

### Preview

```bash
npm run preview
```

Previews production build locally. This is where you can test search functionality.

## Default Configuration

The complete default configuration:

```ts
const DEFAULT_OPTIONS: VittoOptions = {
  // metadata is required - no default
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  partialsDir: 'src/partials',
  minify: false,
  assets: undefined, // Auto-generated by Vite
  dynamicRoutes: [],
  enableSearchIndex: true,
  pagefindOptions: {
    rootSelector: 'html',
    writePlayground: false,
    keepIndexUrl: true,
    verbose: false
  },
  outputStrategy: 'html'
}
```

## Next Steps

- [Examples](./10-examples.md) - Real-world usage examples
- [Troubleshooting](./11-troubleshooting.md) - Common issues and solutions
- [Contributing](./13-contributing.md) - Contribute to Vitto
- [Configuration Guide](./03-configuration.md) - Detailed configuration guide
