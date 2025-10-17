# Configuration

Vitto can be configured through the plugin options in your `vite.config.ts` file.

## Basic Configuration

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      // Your options here
    })
  ],
})
```

## Configuration Options

### `pagesDir`

- **Type**: `string`
- **Default**: `'src/pages'`

Directory containing your page templates (`.vto` files).

```ts
vitto({
  pagesDir: 'src/pages'
})
```

### `layoutsDir`

- **Type**: `string`
- **Default**: `'src/layouts'`

Directory containing your layout templates.

```ts
vitto({
  layoutsDir: 'src/layouts'
})
```

### `partialsDir`

- **Type**: `string`
- **Default**: `'src/partials'`

Directory containing reusable partial templates.

```ts
vitto({
  partialsDir: 'src/partials'
})
```

### `hooksDir`

- **Type**: `string`
- **Default**: `'hooks'`

Directory containing hook files for injecting dynamic data.

```ts
vitto({
  hooksDir: 'hooks'
})
```

### `minify`

- **Type**: `boolean | Partial<MinifyOptions>`
- **Default**: `false`

Enable HTML minification. Set to `true` for default minification or pass custom options.

```ts
// Simple minification
vitto({
  minify: true
})

// Custom minification options
vitto({
  minify: {
    collapseWhitespaces: 'conservative',
    removeComments: true,
    minifyCss: { lib: 'lightningcss' },
    minifyJs: true
  }
})
```

#### Default Minification Options

When `minify: true`, Vitto uses these defaults:

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

### `enableSearchIndex`

- **Type**: `boolean`
- **Default**: `true`

Enable Pagefind search index generation during build.

```ts
vitto({
  enableSearchIndex: true
})
```

### `pagefindOptions`

- **Type**: `PagefindServiceConfig`
- **Default**: See below

Configure Pagefind search indexing behavior.

```ts
vitto({
  pagefindOptions: {
    rootSelector: 'html',
    writePlayground: false,
    keepIndexUrl: true,
    verbose: false
  }
})
```

#### Default Pagefind Options

```ts
{
  rootSelector: 'html',
  writePlayground: false,
  keepIndexUrl: true,
  verbose: false
}
```

### `outputStrategy`

- **Type**: `'html' | 'pretty'`
- **Default**: `'html'`

Determines how HTML files are generated and their URL structure.

**`'html'` strategy**: Generates files as `page.html`
- `about.vto` → `about.html` → `/about.html`
- `blog/post.vto` → `blog/post.html` → `/blog/post.html`

**`'pretty'` strategy**: Generates files as `page/index.html` for clean URLs
- `about.vto` → `about/index.html` → `/about/`
- `blog/post.vto` → `blog/post/index.html` → `/blog/post/`

```ts
vitto({
  outputStrategy: 'pretty'
})
```

### `dynamicRoutes`

- **Type**: `DynamicRouteConfig[]`
- **Default**: `[]`

Configure dynamic route generation. See [Dynamic Routes](./05-dynamic-routes.md) for detailed information.

```ts
vitto({
  dynamicRoutes: [
    {
      template: 'post',
      dataSource: 'posts',
      getParams: (post) => ({ id: post.id }),
      getPath: (post) => `blog/${post.slug}.html`
    }
  ]
})
```

### `hooks`

- **Type**: `Record<string, Function>`
- **Default**: `{}`

Define hooks for injecting dynamic data into templates. See [Hooks System](./06-hooks.md) for details.

```ts
import { defineHooks } from 'vitto'

const postsHook = defineHooks('posts', async () => {
  // Fetch or generate data
  return [
    { id: 1, title: 'First Post', slug: 'first-post' },
    { id: 2, title: 'Second Post', slug: 'second-post' }
  ]
})

vitto({
  hooks: {
    posts: postsHook
  }
})
```

### `assets`

- **Type**: `{ main: string; css: string[] }`
- **Default**: Auto-generated from Vite build

Override Vite-generated assets for template injection. Rarely needed.

```ts
vitto({
  assets: {
    main: 'assets/main.js',
    css: ['assets/style.css']
  }
})
```

### `ventoOptions`

- **Type**: `Partial<VentoOptions>`
- **Default**: `{}`

Pass custom options to the Vento template engine. See [Vento documentation](https://vento.js.org) for available options.

```ts
vitto({
  ventoOptions: {
    autoescape: true,
    includes: ['custom/includes']
  }
})
```

## Complete Example

```ts
import { defineConfig } from 'vite'
import vitto, { defineHooks } from 'vitto'

const postsHook = defineHooks('posts', async () => {
  const response = await fetch('https://api.example.com/posts')
  return response.json()
})

export default defineConfig({
  plugins: [
    vitto({
      pagesDir: 'src/pages',
      layoutsDir: 'src/layouts',
      partialsDir: 'src/partials',
      hooksDir: 'hooks',
      minify: process.env.NODE_ENV === 'production',
      enableSearchIndex: true,
      outputStrategy: 'pretty',
      hooks: {
        posts: postsHook
      },
      dynamicRoutes: [
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post) => ({ id: post.id }),
          getPath: (post) => `blog/${post.slug}.html`
        }
      ],
      pagefindOptions: {
        rootSelector: 'main',
        verbose: true
      }
    })
  ],
})
```

## Environment-Based Configuration

You can adjust configuration based on the build environment:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig(({ mode }) => ({
  plugins: [
    vitto({
      minify: mode === 'production',
      enableSearchIndex: mode === 'production',
      pagefindOptions: {
        verbose: mode === 'development'
      }
    })
  ],
}))
```

## TypeScript Support

Vitto provides full TypeScript support. Import types for better IDE experience:

```ts
import type { VittoOptions } from 'vitto'

const vittoConfig: VittoOptions = {
  pagesDir: 'src/pages',
  minify: true,
  // TypeScript will provide autocomplete and type checking
}
```

## Next Steps

- [Templating Guide](./04-templating.md) - Learn Vento templating syntax
- [Dynamic Routes](./05-dynamic-routes.md) - Generate pages from data
- [Hooks System](./06-hooks.md) - Inject dynamic data into templates
