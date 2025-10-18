# Troubleshooting

This guide covers common issues and their solutions when working with Vitto.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build Errors](#build-errors)
- [Template Errors](#template-errors)
- [Dynamic Routes Issues](#dynamic-routes-issues)
- [Hook Errors](#hook-errors)
- [Search Problems](#search-problems)
- [Asset Loading Issues](#asset-loading-issues)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)

## Installation Issues

### Node Version Mismatch

**Problem**: Error about incompatible Node.js version

**Solution**: Ensure you're using Node.js 20.19+ or 22.12+

```bash
# Check your Node version
node --version

# Install correct version using nvm
nvm install 20
nvm use 20
```

### Package Installation Fails

**Problem**: `npm install` fails with errors

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### PNPM Issues

**Problem**: PNPM installation errors

**Solution**:

```bash
# Update PNPM
npm install -g pnpm@latest

# Clear PNPM cache
pnpm store prune

# Reinstall
pnpm install
```

## Build Errors

### "Cannot find module 'vitto'"

**Problem**: Module not found error

**Solution**:

1. Verify installation:
```bash
npm list vitto
```

2. Reinstall if missing:
```bash
npm install -D vitto
```

3. Check `vite.config.ts`:
```ts
import vitto from 'vitto' // Correct
// not: import vitto from '@vitto/core'
```

### Missing Required Metadata

**Problem**: Error about missing required metadata configuration

```
Error: metadata is required in VittoOptions
```

**Solution**: Ensure `metadata` is provided with required fields:

```ts
// Wrong - missing metadata
vitto({
  pagesDir: 'src/pages'
})

// Correct - metadata is required
vitto({
  metadata: {
    siteName: 'My Site',    // Required
    title: 'My Site'        // Required
  },
  pagesDir: 'src/pages'
})
```

Minimum required fields:
- `siteName` (string)
- `title` (string)

Optional fields:
- `description` (string)
- `keywords` (string[] or string)
- Any custom metadata fields

### Build Hangs or Takes Too Long

**Problem**: Build process never completes

**Solution**:

1. Check for infinite loops in hooks:
```ts
// Bad - infinite recursion
export default defineHooks('data', async () => {
  const data = await defineHooks('data', ...)() // Don't call hooks recursively
  return data
})

// Good - proper hook implementation
export default defineHooks('data', async () => {
  const response = await fetch(url)
  return await response.json()
})
```

2. Add timeouts to external API calls:
```ts
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)

try {
  const response = await fetch(url, { signal: controller.signal })
  return await response.json()
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timed out')
  }
  return []
} finally {
  clearTimeout(timeout)
}
```

3. Enable verbose logging:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  pagefindOptions: {
    verbose: true
  }
})
```

### Out of Memory Errors

**Problem**: `JavaScript heap out of memory`

**Solution**:

1. Increase Node memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

2. Add to `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

3. Reduce data in hooks:
```ts
// Only return necessary fields
export default defineHooks('posts', async () => {
  const allPosts = await fetchPosts()

  return allPosts.map(post => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date
    // Don't include full content here for list pages
  }))
})
```

## Template Errors

### "Layout not found"

**Problem**: Template cannot find layout file

**Solution**:

1. Check the path:
```vento
{{ layout "layouts/base.vto" }}
```

2. Verify `layoutsDir` configuration:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  layoutsDir: 'src/layouts' // Default
})
```

3. Ensure layout file exists:
```bash
ls src/layouts/base.vto
```

### "Include not found"

**Problem**: Cannot find partial/include file

**Solution**:

1. Use correct path relative to `partialsDir`:
```vento
{{ include "partials/header.vto" }}  # Correct
{{ include "header.vto" }}           # Also correct if in partialsDir
```

2. Check `partialsDir` setting:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  partialsDir: 'src/partials'
})
```

### Variable Undefined Errors

**Problem**: Template variables show as undefined

**Solution**:

1. Check hook is registered:
```ts
import postsHook from './hooks/posts'

vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  hooks: {
    posts: postsHook // Make sure this is included
  }
})
```

2. Verify hook returns data:
```ts
export default defineHooks('posts', async () => {
  const data = await fetchData()
  console.log('Posts data:', data) // Debug
  return data // Must return something (array, object, etc.)
})
```

3. Use conditional checks in templates:
```vento
{{ if posts && posts.length > 0 }}
  {{ for post of posts }}
    <h2>{{ post.title }}</h2>
  {{ /for }}
{{ else }}
  <p>No posts found</p>
{{ /if }}
```

4. Check metadata is available:
```vento
{{# Metadata is always available #}}
<h1>{{ metadata.siteName }}</h1>
<meta name="description" content="{{ metadata.description }}">
```

### HTML Not Rendering (Escaped)

**Problem**: HTML shows as text instead of rendering

**Solution**: Use the `safe` filter:

```vento
{{# Wrong - HTML is escaped #}}
{{ content }}

{{# Correct - HTML is rendered #}}
{{ content |> safe }}

{{# Also use safe for renderAssets #}}
{{ renderAssets() |> safe }}
```

## Dynamic Routes Issues

### Pages Not Generated

**Problem**: Dynamic route pages aren't created

**Solution**:

1. Verify configuration:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  hooks: {
    posts: postsHook,
    post: postHook
  },
  dynamicRoutes: [
    {
      template: 'post',        // Must match template name (without .vto)
      dataSource: 'posts',     // Must match hook name
      getParams: (post) => ({ slug: post.slug }),
      getPath: (post) => `blog/${post.slug}.html` // Must include .html
    }
  ]
})
```

2. Check template exists:
```bash
ls src/pages/post.vto
```

3. Ensure hook returns array:
```ts
export default defineHooks('posts', async () => {
  try {
    const posts = await fetchPosts()
    return posts // Must return array
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return [] // Return empty array on error
  }
})
```

### Wrong URLs Generated

**Problem**: Generated URLs don't match expected structure

**Solution**:

1. Check `getPath` function:
```ts
{
  // For /blog/my-post.html
  getPath: (post) => `blog/${post.slug}.html`
}
```

2. For pretty URLs, use `outputStrategy`:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  outputStrategy: 'directory', // Generates: /blog/my-post/index.html
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

### Parameters Not Available in Template

**Problem**: Parameters from `getParams` not accessible

**Solution**:

1. Ensure hook accepts params:
```ts
export const postHook = defineHooks('post', async (params) => {
  if (!params?.slug) {
    console.error('Slug parameter missing')
    return null
  }

  console.log('Received params:', params)
  return await fetchPost(params.slug)
})
```

2. Register parameterized hook:
```ts
import { postsHook, postHook } from './hooks/posts'

vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  hooks: {
    posts: postsHook, // List of all posts
    post: postHook    // Individual post with params
  },
  dynamicRoutes: [
    {
      template: 'post',
      dataSource: 'posts',
      getParams: (post) => ({ slug: post.slug }), // These params go to postHook
      getPath: (post) => `blog/${post.slug}.html`
    }
  ]
})
```

## Hook Errors

### Hook Data Not Available

**Problem**: Hook data doesn't appear in templates

**Solution**:

1. Check hook is imported and registered:
```ts
import myHook from './hooks/myHook'

vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  hooks: {
    myData: myHook // Use this name in templates: {{ myData }}
  }
})
```

2. Verify hook exports correctly:
```ts
// Named export (good for multiple hooks)
export const myHook = defineHooks('myData', async () => {
  return await fetchData()
})

// Default export (preferred for single hook per file)
export default defineHooks('myData', async () => {
  return await fetchData()
})

// Both (best practice)
export const myHook = defineHooks('myData', async () => {
  return await fetchData()
})
export default myHook
```

### Async Hook Errors

**Problem**: Hook fails with async/await errors

**Solution**:

1. Always use async/await:
```ts
// Wrong - don't use .then()
export default defineHooks('data', () => {
  return fetch(url).then(r => r.json())
})

// Correct - use async/await
export default defineHooks('data', async () => {
  const response = await fetch(url)
  return await response.json()
})
```

2. Handle errors properly:
```ts
export default defineHooks('data', async () => {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Hook failed:', error)
    return [] // Return fallback data
  }
})
```

### File System Hook Issues

**Problem**: Can't read files in hooks

**Solution**:

1. Use absolute paths:
```ts
import path from 'node:path'
import fs from 'node:fs/promises'

export default defineHooks('data', async () => {
  const filePath = path.join(process.cwd(), 'content', 'data.json')

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to read file:', filePath, error)
    return {}
  }
})
```

2. Check file exists before reading:
```ts
import fs from 'node:fs/promises'

try {
  await fs.access(filePath)
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('File not found:', filePath)
  }
  return {}
}
```

## Search Problems

### Search Not Working

**Problem**: Pagefind search doesn't work

**Solution**:

1. Ensure search is enabled:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  enableSearchIndex: true // Default is true
})
```

2. Build in production mode:
```bash
npm run build
npm run preview
```

**Important**: Search doesn't work in development mode (`npm run dev`)!

3. Check search files exist:
```bash
ls dist/_pagefind/
```

### No Search Results

**Problem**: Search returns no results

**Solution**:

1. Mark content as searchable:
```vento
<main data-pagefind-body>
  {{ content |> safe }}
</main>
```

2. Check `rootSelector` configuration:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  pagefindOptions: {
    rootSelector: 'html',  // Default
    verbose: true          // Enable for debugging
  }
})
```

3. Remove `data-pagefind-ignore` if mistakenly added:
```vento
{{# Wrong - excludes from search #}}
<article data-pagefind-ignore>
  {{ content |> safe }}
</article>

{{# Correct - includes in search #}}
<article data-pagefind-body>
  {{ content |> safe }}
</article>
```

### Search Index Too Large

**Problem**: Search index files are very large

**Solution**:

1. Configure exclusions:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  pagefindOptions: {
    rootSelector: 'main',
    excludeSelectors: ['nav', 'footer', 'aside', '.sidebar', '.comments']
  }
})
```

2. Use `data-pagefind-ignore` for large sections:
```vento
<article data-pagefind-body>
  <h1>{{ post.title }}</h1>
  <div class="content">{{ post.content |> safe }}</div>

  <div data-pagefind-ignore>
    <div class="comments">
      {{# Comments are excluded from search #}}
    </div>
  </div>
</article>
```

## Asset Loading Issues

### CSS Not Loading

**Problem**: Styles don't apply

**Solution**:

1. Ensure `renderAssets()` is in template:
```vento
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  {{ renderAssets() |> safe }}
</head>
<body>
  {{ content |> safe }}
</body>
</html>
```

2. Check CSS file is imported:
```ts
// src/main.ts or main.js
import './style.css'
```

3. Verify Vite config:
```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      }
    })
  ]
  // No need to configure CSS, Vite handles it automatically
})
```

### JavaScript Not Executing

**Problem**: JavaScript doesn't run

**Solution**:

1. Check script is loaded via `renderAssets()`:
```vento
<head>
  {{ renderAssets() |> safe }}
</head>
```

2. Verify entry point exists:
```bash
ls src/main.ts  # or main.js
```

3. Check for JavaScript errors in browser console

4. Ensure module type is correct:
```html
<!-- renderAssets() generates this automatically -->
<script type="module" src="/src/main.js"></script>
```

### Images Not Found (404)

**Problem**: Images return 404 errors

**Solution**:

1. Put static images in `public/` directory:
```
public/
└── images/
    └── photo.jpg
```

2. Reference without `public/` prefix:
```vento
<img src="/images/photo.jpg" alt="Photo">
```

3. For processed/optimized images, import them:
```ts
// In your script file
import logo from './assets/logo.png'
// logo will be the processed URL
```

## Performance Issues

### Slow Build Times

**Problem**: Build takes too long

**Solution**:

1. Cache hook results:
```ts
let cache = null
let cacheTime = 0
const CACHE_DURATION = 60000 // 1 minute

export default defineHooks('data', async () => {
  const now = Date.now()

  if (cache && (now - cacheTime) < CACHE_DURATION) {
    console.log('Using cached data')
    return cache
  }

  console.log('Fetching fresh data')
  cache = await fetchExpensiveData()
  cacheTime = now

  return cache
})
```

2. Use `Promise.all` for parallel operations:
```ts
// Slow - sequential (10 seconds for 10 files)
const results = []
for (const file of files) {
  results.push(await processFile(file))
}

// Fast - parallel (1 second for 10 files)
const results = await Promise.all(
  files.map(file => processFile(file))
)
```

3. Disable minification in development:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  minify: process.env.NODE_ENV === 'production'
})
```

4. Reduce Pagefind verbosity:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  pagefindOptions: {
    verbose: false
  }
})
```

### Slow Page Loads

**Problem**: Pages load slowly in production

**Solution**:

1. Enable minification:
```ts
vitto({
  metadata: {
    siteName: 'My Site',
    title: 'My Site'
  },
  minify: true
})
```

2. Optimize images before adding to `public/`

3. Enable compression in your hosting provider

4. Use CDN for static assets

See [Performance Guide](./09-performance.md) for more details.

## Deployment Problems

### Build Succeeds Locally but Fails on CI/CD

**Problem**: Production build fails in CI/CD pipeline

**Solution**:

1. Match Node versions:
```yaml
# .github/workflows/deploy.yml
- uses: actions/setup-node@v4
  with:
    node-version: '20' # Match your local version
```

2. Use `npm ci` instead of `npm install`:
```yaml
- run: npm ci
- run: npm run build
```

3. Set environment variables:
```yaml
env:
  NODE_ENV: production
  NODE_OPTIONS: '--max-old-space-size=4096'
```

4. Check for missing dependencies:
```bash
# Ensure all dependencies are in package.json
npm install <missing-package> --save
```

### 404 on Deployed Site

**Problem**: Pages work locally but show 404 on production

**Solution**:

1. Configure base path for subdirectory deployment:
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  base: '/repo-name/', // For GitHub Pages or subdirectory
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      }
    })
  ]
})
```

2. Configure hosting for clean URLs (if using `outputStrategy: 'directory'`):

**Netlify** (`netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** (`vercel.json`):
```json
{
  "cleanUrls": true
}
```

**Nginx**:
```nginx
location / {
  try_files $uri $uri.html $uri/ =404;
}
```

### Assets Not Loading on Production

**Problem**: CSS/JS 404 errors on deployed site

**Solution**:

1. Check base path matches deployment:
```ts
export default defineConfig({
  base: '/my-site/', // Must match your hosting path
  plugins: [vitto({
    metadata: {
      siteName: 'My Site',
      title: 'My Site'
    }
  })]
})
```

2. Verify files exist in `dist/` after build:
```bash
npm run build
ls dist/assets/
```

3. Ensure hosting serves from correct directory:
- GitHub Pages: Set source to `dist/` or `docs/`
- Netlify: Set publish directory to `dist`
- Vercel: Set output directory to `dist`

## Getting Help

If you're still stuck after trying these solutions:

### 1. Check Existing Resources

- **Documentation**: Review relevant docs sections
- **GitHub Issues**: [github.com/riipandi/vitto/issues](https://github.com/riipandi/vitto/issues)
- **Discussions**: Search for similar problems

### 2. Create a Minimal Reproduction

```bash
# Create new minimal project
npm create vitto@latest test-issue
cd test-issue

# Add only the code that causes the issue
# Try to reproduce the problem
# Share repository or code snippet
```

### 3. Open an Issue

When creating an issue, include:

```markdown
## Environment
- Vitto version: (run `npm list vitto`)
- Node version: (run `node --version`)
- Package manager: npm/pnpm/yarn
- OS: macOS/Windows/Linux

## Configuration
```ts
// Your vite.config.ts
```

## Steps to Reproduce
1. ...
2. ...
3. ...

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Error Messages
```
Paste error messages here
```

## Additional Context
Any other relevant information
```

## Next Steps

- [API Reference](./12-api-reference.md) - Complete API documentation
- [Contributing](./13-contributing.md) - Contribute to Vitto
- [Examples](./10-examples.md) - More working examples
- [Performance Guide](./09-performance.md) - Optimize your site
