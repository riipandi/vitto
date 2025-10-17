# Performance Optimization

This guide covers best practices and techniques to optimize your Vitto site for maximum performance.

## Overview

A fast website improves user experience, SEO rankings, and conversion rates. Vitto is built on Vite, which provides excellent performance out of the box, but there are additional optimizations you can apply.

## Build Optimization

### Enable Minification

Enable HTML minification in production:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      minify: process.env.NODE_ENV === 'production',
      minifyOptions: {
        collapseWhitespaces: 'conservative',
        removeComments: true,
        minifyCss: { lib: 'lightningcss' },
        minifyJs: true
      }
    })
  ]
})
```

### Tree Shaking

Vite automatically removes unused code. Import only what you need:

```js
// Good - imports only what's needed
import { debounce } from 'lodash-es'

// Avoid - imports entire library
import _ from 'lodash'
```

### Code Splitting

Vite automatically splits code. For manual control:

```js
// Lazy load heavy components
const HeavyComponent = () => import('./HeavyComponent.js')
```

## Asset Optimization

### Images

#### 1. Use Appropriate Formats

- **WebP**: Modern format with great compression
- **AVIF**: Even better compression, growing browser support
- **JPEG**: Photos and complex images
- **PNG**: Images requiring transparency
- **SVG**: Icons and simple graphics

#### 2. Optimize Images

Use tools like:
- [Squoosh](https://squoosh.app/)
- [ImageOptim](https://imageoptim.com/)
- [Sharp](https://sharp.pixelplumbing.com/)

```bash
# Install sharp for image processing
npm install sharp
```

```js
// hooks/images.ts
import sharp from 'sharp'

export default defineHooks('optimizedImages', async () => {
  const images = await getImages()

  await Promise.all(images.map(async (img) => {
    await sharp(img.path)
      .resize(1200, 800, { fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(img.outputPath)
  }))

  return images
})
```

#### 3. Responsive Images

```vento
<picture>
  <source
    srcset="/images/hero-large.webp"
    media="(min-width: 1024px)"
    type="image/webp"
  >
  <source
    srcset="/images/hero-medium.webp"
    media="(min-width: 640px)"
    type="image/webp"
  >
  <img
    src="/images/hero-small.jpg"
    alt="{{ title }}"
    loading="lazy"
    width="800"
    height="600"
  >
</picture>
```

#### 4. Lazy Loading

```vento
<img
  src="/images/photo.jpg"
  alt="{{ alt }}"
  loading="lazy"
  width="800"
  height="600"
>
```

### CSS

#### 1. Remove Unused CSS

Use PurgeCSS with Tailwind CSS:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{vto,html,js,ts}'
  ],
  // ...
}
```

#### 2. Critical CSS

Inline critical CSS in `<head>`:

```vento
<head>
  <style>
    /* Critical above-the-fold styles */
    body { margin: 0; font-family: sans-serif; }
    .header { background: #000; color: #fff; }
  </style>
  {{ renderAssets() |> safe }}
</head>
```

#### 3. CSS Optimization

Vite automatically optimizes CSS. For more control:

```ts
// vite.config.ts
export default defineConfig({
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        additionalData: '@import "./src/styles/variables.scss";'
      }
    }
  }
})
```

### JavaScript

#### 1. Minimize Third-Party Scripts

Only include essential scripts:

```vento
{{# Load analytics only in production #}}
{{ if config.environment === 'production' }}
  <script defer src="https://analytics.example.com/script.js"></script>
{{ /if }}
```

#### 2. Defer Non-Critical Scripts

```html
<script defer src="/scripts/analytics.js"></script>
<script async src="/scripts/ads.js"></script>
```

#### 3. Use Modern JavaScript

Vite builds for modern browsers by default:

```ts
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: false
    }
  }
})
```

## Content Optimization

### Reduce Page Weight

#### 1. Optimize HTML

```ts
vitto({
  minify: true,
  minifyOptions: {
    removeComments: true,
    collapseWhitespaces: 'conservative'
  }
})
```

#### 2. Limit Data in Templates

Only pass necessary data to templates:

```ts
export default defineHooks('posts', async () => {
  const posts = await getAllPosts()

  // Only return fields needed for display
  return posts.map(post => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date
    // Don't include full content in list view
  }))
})
```

#### 3. Paginate Long Lists

```ts
const POSTS_PER_PAGE = 10

export default defineHooks('paginatedPosts', async () => {
  const allPosts = await getAllPosts()
  const pages = []

  for (let i = 0; i < allPosts.length; i += POSTS_PER_PAGE) {
    pages.push({
      posts: allPosts.slice(i, i + POSTS_PER_PAGE),
      pageNumber: Math.floor(i / POSTS_PER_PAGE) + 1
    })
  }

  return pages
})
```

### Font Optimization

#### 1. Self-Host Fonts

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```

#### 2. Use font-display

```css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont.woff2') format('woff2');
  font-display: swap; /* or 'optional' */
}
```

#### 3. Subset Fonts

Only include characters you need:

```bash
# Using glyphhanger
npx glyphhanger --subset=font.ttf --formats=woff2 --css
```

## Caching Strategy

### Static Assets

Configure cache headers in your hosting platform:

```
# Long cache for hashed assets
/assets/*
  Cache-Control: max-age=31536000, immutable

# Short cache for HTML
/*.html
  Cache-Control: max-age=0, must-revalidate, public
```

### Service Worker

Implement a service worker for offline support:

```js
// public/sw.js
const CACHE_NAME = 'vitto-v1'
const urlsToCache = [
  '/',
  '/styles.css',
  '/main.js'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  )
})
```

Register in your template:

```vento
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
</script>
```

## Network Optimization

### Preconnect to Required Origins

```vento
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://api.example.com">
</head>
```

### Prefetch Next Pages

```vento
{{# Prefetch important pages #}}
<link rel="prefetch" href="/about.html">
<link rel="prefetch" href="/blog.html">
```

### Resource Hints

```vento
<head>
  {{# Preload critical resources #}}
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

  {{# Preconnect to external domains #}}
  <link rel="preconnect" href="https://analytics.example.com">

  {{# DNS prefetch for third-party resources #}}
  <link rel="dns-prefetch" href="https://cdn.example.com">
</head>
```

## Search Index Optimization

### Reduce Index Size

```ts
vitto({
  pagefindOptions: {
    rootSelector: 'main', // Index only main content
    excludeSelectors: ['nav', 'footer', '.sidebar']
  }
})
```

### Exclude Unnecessary Pages

```vento
{{# Don't index error pages #}}
<div data-pagefind-ignore>
  <h1>404 Not Found</h1>
</div>
```

## Monitoring Performance

### Core Web Vitals

Monitor key metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Tools

Use these tools to measure performance:

1. **Lighthouse** (Chrome DevTools)
2. **PageSpeed Insights**
3. **WebPageTest**
4. **Chrome User Experience Report**

### Implement Performance Monitoring

```vento
<script>
  // Web Vitals
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

  function sendToAnalytics(metric) {
    console.log(metric)
    // Send to your analytics
  }

  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
</script>
```

## Build Performance

### Faster Builds

#### 1. Use npm ci

```bash
# Instead of npm install
npm ci
```

#### 2. Cache Dependencies

In GitHub Actions:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

#### 3. Parallel Processing

```ts
// Process data in parallel
export default defineHooks('posts', async () => {
  const files = await getMarkdownFiles()

  // Process in parallel
  const posts = await Promise.all(
    files.map(async (file) => {
      return await processMarkdown(file)
    })
  )

  return posts
})
```

#### 4. Cache Hook Results

```ts
let cachedData = null

export default defineHooks('data', async () => {
  if (cachedData) return cachedData

  cachedData = await fetchExpensiveData()
  return cachedData
})
```

## Best Practices Checklist

- [ ] Enable minification for production
- [ ] Optimize and compress images
- [ ] Use lazy loading for images
- [ ] Minimize third-party scripts
- [ ] Implement proper caching headers
- [ ] Use modern image formats (WebP, AVIF)
- [ ] Self-host fonts with font-display: swap
- [ ] Remove unused CSS
- [ ] Enable gzip/brotli compression
- [ ] Implement resource hints (preconnect, dns-prefetch)
- [ ] Monitor Core Web Vitals
- [ ] Optimize search index size
- [ ] Use CDN for static assets
- [ ] Implement service worker for offline support
- [ ] Lazy load non-critical JavaScript

## Performance Budget

Set performance budgets:

```ts
// vite.config.ts
export default defineConfig({
  build: {
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500, // KB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['heavy-library']
        }
      }
    }
  }
})
```

## Benchmarking

### Before Optimization

```
Lighthouse Score: 85
LCP: 3.2s
FID: 120ms
CLS: 0.15
Total Size: 2.5MB
```

### After Optimization

```
Lighthouse Score: 98
LCP: 1.8s
FID: 45ms
CLS: 0.05
Total Size: 850KB
```

## Next Steps

- [Examples](./10-examples.md) - Real-world performance examples
- [Troubleshooting](./11-troubleshooting.md) - Common performance issues
- [API Reference](./12-api-reference.md) - Complete API documentation
