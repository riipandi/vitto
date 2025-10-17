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
```

2. Add timeouts to external API calls:
```ts
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)

try {
  const response = await fetch(url, { signal: controller.signal })
  return await response.json()
} catch (error) {
  console.error('Request timed out')
  return []
} finally {
  clearTimeout(timeout)
}
```

3. Enable verbose logging:
```ts
vitto({
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
return posts.map(post => ({
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt
  // Don't include full content here
}))
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
  partialsDir: 'src/partials'
})
```

### Variable Undefined Errors

**Problem**: Template variables show as undefined

**Solution**:

1. Check hook is registered:
```ts
vitto({
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
  return data // Must return something
})
```

3. Use conditional checks in templates:
```vento
{{ if posts && posts.length > 0 }}
  {{ for post of posts }}
    {{ post.title }}
  {{ /for }}
{{ else }}
  <p>No posts found</p>
{{ /if }}
```

### HTML Not Rendering (Escaped)

**Problem**: HTML shows as text instead of rendering

**Solution**: Use the `safe` filter:

```vento
{{# Wrong - HTML is escaped #}}
{{ content }}

{{# Correct - HTML is rendered #}}
{{ content |> safe }}
```

## Dynamic Routes Issues

### Pages Not Generated

**Problem**: Dynamic route pages aren't created

**Solution**:

1. Verify configuration:
```ts
dynamicRoutes: [
  {
    template: 'post',        // Must match template name (without .vto)
    dataSource: 'posts',     // Must match hook name
    getParams: (post) => ({ slug: post.slug }),
    getPath: (post) => `blog/${post.slug}.html` // Must include .html
  }
]
```

2. Check template exists:
```bash
ls src/pages/post.vto
```

3. Ensure hook returns array:
```ts
export default defineHooks('posts', async () => {
  return [] // Must return array, even if empty
})
```

### Wrong URLs Generated

**Problem**: Generated URLs don't match expected structure

**Solution**:

1. Check `getPath` function:
```ts
{
  getPath: (post) => `blog/${post.slug}.html` // Generates: /blog/my-post.html
}
```

2. For "pretty URLs", use `outputStrategy`:
```ts
vitto({
  outputStrategy: 'pretty' // Generates: /blog/my-post/index.html
})
```

### Parameters Not Available in Template

**Problem**: Parameters from `getParams` not accessible

**Solution**:

1. Ensure hook accepts params:
```ts
export const postHook = defineHooks('post', async (params) => {
  console.log('Received params:', params)
  // Use params here
  return await fetchPost(params.slug)
})
```

2. Register parameterized hook:
```ts
vitto({
  hooks: {
    post: postHook // Individual post hook
  }
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
  hooks: {
    myData: myHook // Use this name in templates: {{ myData }}
  }
})
```

2. Verify hook exports correctly:
```ts
// Named export
export const myHook = defineHooks('myData', async () => { ... })

// Default export (preferred)
export default defineHooks('myData', async () => { ... })
```

### Async Hook Errors

**Problem**: Hook fails with async/await errors

**Solution**:

1. Always use async/await:
```ts
// Wrong
export default defineHooks('data', () => {
  fetch(url).then(r => r.json()) // Don't use .then()
})

// Correct
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
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

const filePath = path.join(process.cwd(), 'content', 'data.json')
```

2. Check file exists:
```ts
import fs from 'node:fs/promises'

try {
  await fs.access(filePath)
  const content = await fs.readFile(filePath, 'utf-8')
} catch (error) {
  console.error('File not found:', filePath)
}
```

## Search Problems

### Search Not Working

**Problem**: Pagefind search doesn't work

**Solution**:

1. Ensure search is enabled:
```ts
vitto({
  enableSearchIndex: true
})
```

2. Build in production mode:
```bash
npm run build
npm run preview
```

Search doesn't work in development mode!

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

2. Check `rootSelector`:
```ts
vitto({
  pagefindOptions: {
    rootSelector: 'main' // Must match your HTML structure
  }
})
```

3. Remove `data-pagefind-ignore` if mistakenly added:
```vento
{{# Wrong - excludes from search #}}
<article data-pagefind-ignore>

{{# Correct #}}
<article data-pagefind-body>
```

### Search Index Too Large

**Problem**: Search index files are very large

**Solution**:

1. Index only main content:
```ts
vitto({
  pagefindOptions: {
    rootSelector: 'main',
    excludeSelectors: ['nav', 'footer', 'aside', '.sidebar']
  }
})
```

2. Use `data-pagefind-ignore` for large sections:
```vento
<div data-pagefind-ignore>
  <div class="comments">...</div>
</div>
```

## Asset Loading Issues

### CSS Not Loading

**Problem**: Styles don't apply

**Solution**:

1. Ensure `renderAssets()` is in template:
```vento
<head>
  {{ renderAssets() |> safe }}
</head>
```

2. Check CSS file is imported:
```ts
// src/main.ts or main.js
import './style.css'
```

3. Verify Vite config:
```ts
export default defineConfig({
  plugins: [vitto()],
  // No need to configure CSS, Vite handles it
})
```

### JavaScript Not Executing

**Problem**: JavaScript doesn't run

**Solution**:

1. Check script is loaded:
```vento
<head>
  {{ renderAssets() |> safe }}
</head>
```

2. Verify entry point exists:
```bash
ls src/main.ts  # or main.js
```

3. Check browser console for errors

### Images Not Found (404)

**Problem**: Images return 404 errors

**Solution**:

1. Put images in `public/` directory:
```
public/
└── images/
    └── photo.jpg
```

2. Reference without `public/`:
```vento
<img src="/images/photo.jpg" alt="Photo">
```

3. For processed images, import them:
```ts
import logo from './assets/logo.png'
// Use logo in template
```

## Performance Issues

### Slow Build Times

**Problem**: Build takes too long

**Solution**:

1. Cache hook results:
```ts
let cache = null

export default defineHooks('data', async () => {
  if (cache) return cache
  cache = await fetchData()
  return cache
})
```

2. Use `Promise.all` for parallel operations:
```ts
// Slow - sequential
for (const file of files) {
  await processFile(file)
}

// Fast - parallel
await Promise.all(files.map(file => processFile(file)))
```

3. Reduce minification in development:
```ts
vitto({
  minify: process.env.NODE_ENV === 'production'
})
```

### Slow Page Loads

**Problem**: Pages load slowly

**Solution**:

1. Enable compression in hosting
2. Optimize images
3. Reduce JavaScript bundle size
4. Enable caching

See [Performance Guide](./09-performance.md) for details.

## Deployment Problems

### Build Succeeds Locally but Fails on CI/CD

**Problem**: Production build fails in CI/CD

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
```

3. Set environment variables:
```yaml
env:
  NODE_ENV: production
```

### 404 on Deployed Site

**Problem**: Pages work locally but 404 on production

**Solution**:

1. Configure base path for subdirectory deployment:
```ts
// vite.config.ts
export default defineConfig({
  base: '/repo-name/', // For GitHub Pages
  plugins: [vitto()]
})
```

2. Add redirects for SPA behavior:
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Assets Not Loading on Production

**Problem**: CSS/JS 404 errors on deployed site

**Solution**:

1. Check base path configuration
2. Verify files are in `dist/` after build
3. Ensure hosting serves from correct directory

## Getting Help

If you're still stuck:

1. **Check GitHub Issues**: [github.com/riipandi/vitto/issues](https://github.com/riipandi/vitto/issues)
2. **Search Discussions**: Look for similar problems
3. **Create an Issue**: Provide:
   - Vitto version
   - Node version
   - Minimal reproduction
   - Error messages
   - Steps to reproduce

### Minimal Reproduction

Create a minimal example:

```bash
# Create new project
npm create vitto@latest test-project
cd test-project

# Add your problematic code
# Try to reproduce the issue
# Share repository or code
```

## Next Steps

- [API Reference](./12-api-reference.md) - Complete API documentation
- [Contributing](./13-contributing.md) - Contribute to Vitto
- [Examples](./10-examples.md) - More working examples
