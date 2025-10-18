# Comparison with Other Static Site Generators

Learn how Vitto compares to other popular static site generators and when to choose each one.

## Table of Contents

- [Overview](#overview)
- [Vitto vs Next.js](#vitto-vs-nextjs)
- [Vitto vs Astro](#vitto-vs-astro)
- [Vitto vs Gatsby](#vitto-vs-gatsby)
- [Vitto vs Docusaurus](#vitto-vs-docusaurus)
- [Vitto vs VitePress](#vitto-vs-vitepress)
- [Vitto vs Eleventy](#vitto-vs-eleventy)
- [Feature Comparison Matrix](#feature-comparison-matrix)
- [When to Choose Vitto](#when-to-choose-vitto)
- [Migration Guides](#migration-guides)

## Overview

Vitto is a lightweight, Vite-powered static site generator that focuses on simplicity and developer experience. Here's how it compares to other popular solutions.

### Key Differentiators

- **Vite-Powered**: Built on Vite for lightning-fast development and powerful tooling
- **Simple API**: Minimal configuration required
- **Template Flexibility**: Uses Vento templating engine
- **Hook System**: Powerful data fetching without GraphQL
- **Built-in Search**: Pagefind integration out of the box
- **TypeScript Native**: First-class TypeScript support
- **Easy Integration**: Seamlessly integrate any library (HTMX, Tailwind CSS, Alpine.js, etc.)

### The Vite Advantage

Because Vitto is built on Vite, you get:

- ⚡ Lightning-fast HMR (Hot Module Replacement)
- 📦 Optimized bundling with Rollup
- 🎨 Easy integration with CSS frameworks (Tailwind CSS, UnoCSS, etc.)
- 🔧 Plugin ecosystem (PostCSS, autoprefixer, etc.)
- 🚀 Modern JavaScript/TypeScript support out of the box

**Integration Examples:**

```ts
// vite.config.ts - Tailwind CSS via bundler
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      }
    }),
    tailwindcss(),
  ]
})
```

```vento
{{/* Or use CDN for quick prototyping */}}
<!DOCTYPE html>
<html>
<head>
  {{ renderAssets() |> safe }}
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body>
  {{/* Your content with HTMX, Alpine.js, and Tailwind */}}
  <div x-data="{ open: false }">
    <button @click="open = !open" class="px-4 py-2 bg-blue-500 text-white">
      Toggle
    </button>
    <div x-show="open" hx-get="/api/data" hx-trigger="click">
      Dynamic content
    </div>
  </div>
</body>
</html>
```

## Vitto vs Next.js

### Next.js Overview

Next.js is a full-featured React framework with SSR, SSG, and ISR capabilities.

### Comparison

| Feature                 | Vitto                  | Next.js                |
|-------------------------|------------------------|------------------------|
| **Framework**           | Vite + Vento           | React                  |
| **Learning Curve**      | Low                    | Medium-High            |
| **Build Speed**         | Very Fast (Vite)       | Fast                   |
| **Bundle Size**         | Minimal                | Larger (React runtime) |
| **SSG**                 | ✅                      | ✅                      |
| **SSR**                 | ❌                      | ✅                      |
| **API Routes**          | ❌                      | ✅                      |
| **Image Optimization**  | Manual/Vite plugins    | Built-in               |
| **Built-in Search**     | ✅ (Pagefind)           | ❌                      |
| **TypeScript**          | ✅                      | ✅                      |
| **Setup Complexity**    | Minimal                | Medium                 |
| **Library Integration** | Any (via Vite/CDN)     | React ecosystem        |
| **CSS Framework**       | Any (Tailwind, UnoCSS) | Any (with setup)       |

### When to Use Vitto

✅ **Choose Vitto if:**
- You need a simple static blog or documentation site
- You want minimal JavaScript in the browser
- You prefer template-based development
- You need fast build times with Vite
- You want built-in search without extra setup
- You want to use HTMX, Alpine.js, or other vanilla JS libraries
- You need easy CSS framework integration (Tailwind, UnoCSS)

❌ **Choose Next.js if:**
- You need server-side rendering (SSR)
- You're building a complex web application
- You need API routes
- You require advanced image optimization
- Your team is already invested in React ecosystem

### Example Comparison

**Next.js** (pages/blog/[slug].tsx):
```tsx
import { GetStaticPaths, GetStaticProps } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await fetchPosts()
  return {
    paths: posts.map(post => ({ params: { slug: post.slug } })),
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await fetchPost(params.slug)
  return { props: { post } }
}

export default function Post({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

**Vitto** (src/pages/post.vto):
```vento
{{ layout "layouts/base.vto" }}

<article>
  <h1>{{ post.title }}</h1>
  <div>{{ post.content |> safe }}</div>
</article>
```

```ts
// hooks/posts.ts
export const postsHook = defineHooks('posts', async () => {
  return await fetchPosts()
})

export const postHook = defineHooks('post', async (params) => {
  return await fetchPost(params.slug)
})

// vite.config.ts
vitto({
  metadata: { siteName: 'Blog', title: 'Blog' },
  hooks: { posts: postsHook, post: postHook },
  dynamicRoutes: [{
    template: 'post',
    dataSource: 'posts',
    getParams: (post) => ({ slug: post.slug }),
    getPath: (post) => `blog/${post.slug}.html`
  }]
})
```

## Vitto vs Astro

### Astro Overview

Astro is a modern static site builder that supports multiple UI frameworks and ships zero JavaScript by default.

### Comparison

| Feature                 | Vitto                    | Astro                    |
|-------------------------|--------------------------|--------------------------|
| **Framework**           | Vite + Vento             | Astro + Any Framework    |
| **UI Framework**        | Template-based           | React, Vue, Svelte, etc. |
| **Learning Curve**      | Low                      | Low-Medium               |
| **Build Speed**         | Very Fast (Vite)         | Very Fast                |
| **Zero JS by Default**  | ✅                        | ✅                        |
| **Component Islands**   | ❌                        | ✅                        |
| **Built-in Search**     | ✅ (Pagefind)             | ❌ (Add-on)               |
| **Content Collections** | Hooks                    | Built-in                 |
| **TypeScript**          | ✅                        | ✅                        |
| **SSR Support**         | ❌                        | ✅ (Optional)             |
| **Library Integration** | Any (HTMX, Alpine, etc.) | Framework-specific       |
| **Vite Plugins**        | ✅ Direct access          | ✅ Through Astro config   |

### When to Use Vitto

✅ **Choose Vitto if:**
- You prefer template-based development
- You want minimal configuration
- You need built-in search
- You don't need component islands
- You want a simpler mental model
- You want to use vanilla JS libraries (HTMX, Alpine.js)
- You prefer direct Vite configuration

❌ **Choose Astro if:**
- You want to use React/Vue/Svelte components
- You need component-level hydration (islands)
- You want content collections out of the box
- You might need SSR in the future
- You want more framework flexibility

### Library Integration Example

**Vitto with HTMX + Alpine.js + Tailwind:**
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [vitto({
    metadata: { siteName: 'My App', title: 'My App' }
  })],
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')]
    }
  }
})
```

```vento
{{/* src/pages/index.vto */}}
{{ layout "layouts/base.vto" }}

<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">Content</div>
</div>

<div hx-get="/api/data" hx-trigger="click">
  Load data
</div>
```

```ts
// src/main.ts
import 'htmx.org'
import Alpine from 'alpinejs'
import './style.css'

window.Alpine = Alpine
Alpine.start()
```

**Or use CDN for quick setup:**
```vento
<!DOCTYPE html>
<html>
<head>
  {{ renderAssets() |> safe }}
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
  {{/* Your content */}}
</body>
</html>
```

## Vitto vs Gatsby

### Gatsby Overview

Gatsby is a React-based framework with GraphQL for data management and a rich plugin ecosystem.

### Comparison

| Feature                 | Vitto                 | Gatsby                 |
|-------------------------|-----------------------|------------------------|
| **Framework**           | Vite + Vento          | React + GraphQL        |
| **Learning Curve**      | Low                   | High                   |
| **Build Speed**         | Very Fast (Vite)      | Slow (for large sites) |
| **Data Layer**          | Hooks (Simple)        | GraphQL (Complex)      |
| **Plugin Ecosystem**    | Growing               | Extensive              |
| **Image Optimization**  | Vite plugins          | gatsby-plugin-image    |
| **Built-in Search**     | ✅ (Pagefind)          | Plugin required        |
| **TypeScript**          | ✅                     | ✅                      |
| **Setup Complexity**    | Minimal               | High                   |
| **CSS Framework**       | Easy (via Vite)       | Needs plugins          |
| **Library Integration** | Simple (Vite-powered) | Complex (plugin-based) |

### When to Use Vitto

✅ **Choose Vitto if:**
- You want fast build times with Vite
- You don't need GraphQL complexity
- You prefer simplicity over features
- You're building a small to medium site
- You want built-in search
- You want easy library integration (Tailwind, HTMX, etc.)
- You prefer direct configuration over plugins

❌ **Choose Gatsby if:**
- You need GraphQL for data management
- You want extensive plugin ecosystem
- You need advanced image optimization
- You're building a large, complex site
- Your team knows React and GraphQL well

### Integration Comparison

**Gatsby** (Complex setup):
```javascript
// gatsby-config.js
module.exports = {
  plugins: [
    'gatsby-plugin-postcss',
    'gatsby-plugin-image',
    {
      resolve: 'gatsby-plugin-react-helmet',
      options: { /* ... */ }
    }
  ]
}

// Need separate webpack config for custom libraries
```

**Vitto** (Simple setup):
```ts
// vite.config.ts - Everything in one place
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [vitto({
    metadata: { siteName: 'My Site', title: 'My Site' }
  })],
  // Use any Vite plugin directly
  css: {
    postcss: {
      plugins: [require('tailwindcss')]
    }
  }
})
```

## Vitto vs Docusaurus

### Docusaurus Overview

Docusaurus is a documentation-focused static site generator built with React.

### Comparison

| Feature                 | Vitto                     | Docusaurus       |
|-------------------------|---------------------------|------------------|
| **Primary Use**         | General Purpose           | Documentation    |
| **Framework**           | Vite + Vento              | React            |
| **Learning Curve**      | Low                       | Low-Medium       |
| **Versioning**          | Manual                    | Built-in         |
| **i18n**                | Manual                    | Built-in         |
| **Search**              | ✅ Pagefind                | ✅ Algolia        |
| **MDX Support**         | Hooks                     | ✅                |
| **API Docs**            | Manual                    | Built-in         |
| **Theming**             | Custom (Full control)     | Pre-built themes |
| **TypeScript**          | ✅                         | ✅                |
| **Library Integration** | Easy (HTMX, Alpine, etc.) | React-based      |
| **Build Tool**          | Vite                      | Webpack          |

### When to Use Vitto

✅ **Choose Vitto if:**
- You need flexibility beyond documentation
- You want faster builds with Vite
- You prefer template-based development
- You don't need doc versioning
- You want minimal JavaScript
- You want to use vanilla JS libraries
- You prefer full control over theming

❌ **Choose Docusaurus if:**
- You're building documentation specifically
- You need doc versioning
- You need i18n out of the box
- You want pre-built doc themes
- You need Algolia search integration
- You want MDX support

### Library Integration Example

**Vitto** (Flexible approach):
```vento
{{/* Add any library easily */}}
<!DOCTYPE html>
<html>
<head>
  {{ renderAssets() |> safe }}

  {{/* Via CDN for quick setup */}}
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>

  {{/* Or via Vite bundler (imported in main.ts) */}}
</head>
<body>
  <div hx-get="/search" hx-trigger="keyup changed delay:500ms">
    <input type="search" name="q" class="search-input">
  </div>
</body>
</html>
```

## Vitto vs VitePress

### VitePress Overview

VitePress is a Vite-powered static site generator optimized for documentation, successor to VuePress.

### Comparison

| Feature                 | Vitto                     | VitePress        |
|-------------------------|---------------------------|------------------|
| **Primary Use**         | General Purpose           | Documentation    |
| **Framework**           | Vento                     | Vue 3            |
| **Learning Curve**      | Low                       | Low              |
| **Build Speed**         | Very Fast (Vite)          | Very Fast (Vite) |
| **Theme**               | Custom (Full flexibility) | Pre-built        |
| **Sidebar**             | Custom via hooks          | Built-in         |
| **Search**              | Pagefind                  | MiniSearch       |
| **Markdown**            | Via hooks                 | Built-in         |
| **TypeScript**          | ✅                         | ✅                |
| **SFC Support**         | ❌                         | ✅ (Vue)          |
| **Vite Plugins**        | ✅ Direct access           | ✅ Direct access  |
| **Library Integration** | Any vanilla JS library    | Vue-based        |

### When to Use Vitto

✅ **Choose Vitto if:**
- You need more than just documentation
- You prefer template syntax over Vue
- You want more flexibility in structure
- You need custom data sources
- You don't need Vue components
- You want to use HTMX, Alpine.js, or vanilla JS
- You prefer complete control over markup

❌ **Choose VitePress if:**
- You're building documentation primarily
- You want pre-built doc themes
- You like Vue and want to use Vue components
- You need automatic sidebar generation
- You want markdown-centric workflow

### Both Use Vite!

Since both use Vite, they share similar benefits:

```ts
// Both can use Vite plugins the same way
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    vitto({ /* ... */ }), // or VitePress
    UnoCSS()
  ]
})
```

**But Vitto gives you more flexibility:**
```vento
{{/* Use any library without Vue wrapper */}}
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
</div>

<div hx-get="/api/data" hx-trigger="click">
  Click to load
</div>
```

## Vitto vs Eleventy

### Eleventy Overview

Eleventy is a simpler static site generator with multiple template language support.

### Comparison

| Feature                   | Vitto                | Eleventy (11ty)        |
|---------------------------|----------------------|------------------------|
| **Build Tool**            | Vite                 | Custom                 |
| **Templates**             | Vento                | Nunjucks, Liquid, etc. |
| **Learning Curve**        | Low                  | Low                    |
| **Build Speed**           | Very Fast (Vite)     | Fast                   |
| **JavaScript in Browser** | Optional             | Optional               |
| **Hot Reload**            | ✅ (Vite HMR)         | ✅                      |
| **Plugin System**         | Vite plugins         | Eleventy plugins       |
| **Built-in Search**       | ✅                    | ❌                      |
| **TypeScript Config**     | ✅ Native             | ⚠️ (Manual)            |
| **Asset Pipeline**        | Vite (Modern)        | Manual/Plugins         |
| **Library Integration**   | Easy (bundler + CDN) | Manual                 |
| **CSS Processing**        | Built-in (Vite)      | Needs setup            |

### When to Use Vitto

✅ **Choose Vitto if:**
- You want Vite's modern dev experience
- You need built-in search
- You prefer TypeScript configuration
- You want faster builds with HMR
- You like the hook system for data
- You want easy CSS framework integration
- You need modern JavaScript tooling
- You want simple library integration (HTMX, Alpine.js, etc.)

❌ **Choose Eleventy if:**
- You need multiple template languages
- You want maximum flexibility
- You prefer convention over configuration
- You have existing Eleventy plugins
- You don't need modern build tooling

### Library Integration Comparison

**Eleventy** (Manual setup):
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  // Need to manually copy assets
  eleventyConfig.addPassthroughCopy('src/js')
  eleventyConfig.addPassthroughCopy('src/css')

  // Manual CSS processing
  eleventyConfig.addPlugin(require('eleventy-plugin-postcss'))
}
```

**Vitto** (Automatic with Vite):
```ts
// vite.config.ts - Vite handles everything
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [vitto({
    metadata: { siteName: 'My Site', title: 'My Site' }
  })],
  // CSS processing is automatic
  // HMR is built-in
  // Modern JS is transpiled automatically
})
```

```ts
// src/main.ts - Import libraries like any Vite app
import 'htmx.org'
import Alpine from 'alpinejs'
import './style.css' // Processed automatically

window.Alpine = Alpine
Alpine.start()
```

## Feature Comparison Matrix

| Feature                 | Vitto   | Next.js | Astro  | Gatsby  | Docusaurus | VitePress | Eleventy |
|-------------------------|---------|---------|--------|---------|------------|-----------|----------|
| **SSG**                 | ✅       | ✅       | ✅      | ✅       | ✅          | ✅         | ✅        |
| **SSR**                 | ❌       | ✅       | ✅      | ❌       | ❌          | ❌         | ❌        |
| **Build Tool**          | Vite    | Webpack | Vite   | Webpack | Webpack    | Vite      | Custom   |
| **Learning Curve**      | Easy    | Hard    | Medium | Hard    | Medium     | Easy      | Easy     |
| **TypeScript**          | ✅       | ✅       | ✅      | ✅       | ✅          | ✅         | ⚠️       |
| **Built-in Search**     | ✅       | ❌       | ❌      | ❌       | ✅          | ✅         | ❌        |
| **Zero JS**             | ✅       | ❌       | ✅      | ❌       | ❌          | ✅         | ✅        |
| **Vite Plugins**        | ✅       | ❌       | ✅      | ❌       | ❌          | ✅         | ❌        |
| **Easy CSS Framework**  | ✅       | ⚠️      | ✅      | ⚠️      | ⚠️         | ✅         | ⚠️       |
| **HTMX/Alpine Support** | ✅       | ⚠️      | ✅      | ⚠️      | ⚠️         | ✅         | ✅        |
| **Plugin Ecosystem**    | ❌       | Large   | Large  | Large   | Medium     | Medium    | Large    |
| **Image Optimization**  | Vite    | ✅       | ✅      | ✅       | ✅          | ❌         | Manual   |
| **MDX Support**         | Hooks   | ✅       | ✅      | ✅       | ✅          | ✅         | ⚠️       |
| **Hot Reload**          | ✅ (HMR) | ✅       | ✅      | ✅       | ✅          | ✅ (HMR)   | ✅        |

**Legend:**
- ✅ Built-in support / Easy integration
- ⚠️ Requires plugins/manual setup
- ❌ Not supported

## When to Choose Vitto

### Ideal Use Cases

Vitto is perfect for:

1. **Blogs**
   - Personal blogs
   - Tech blogs
   - Content-heavy sites

2. **Documentation**
   - Project documentation
   - API documentation
   - Internal wiki

3. **Landing Pages**
   - Product pages
   - Marketing sites
   - Portfolio sites

4. **Small to Medium Sites**
   - Company websites
   - Event websites
   - Community sites

5. **Sites Using Vanilla JS Libraries**
   - HTMX-powered applications
   - Alpine.js interactive sites
   - Tailwind CSS designs

### Vitto Strengths

✅ **Vite-Powered**
- Lightning-fast HMR (Hot Module Replacement)
- Modern build tooling out of the box
- Optimized production builds
- Plugin ecosystem access

✅ **Easy Library Integration**
- Use any library via Vite bundler (npm install)
- Or use CDN for quick prototyping
- HTMX, Alpine.js, Tailwind CSS work seamlessly
- No framework lock-in

✅ **Simplicity**
- Minimal configuration
- Easy to understand
- Quick to set up
- Template-based approach

✅ **Built-in Search**
- Pagefind integration included
- No external services required
- Works offline

✅ **Developer Experience**
- TypeScript-first configuration
- Great error messages
- Modern tooling (Vite, Vento)
- Fast feedback loop

✅ **Flexibility**
- Custom data sources via hooks
- Template-based approach
- Direct Vite configuration
- No lock-in to specific framework

### Integration Examples

**Using Tailwind CSS:**
```bash
npm install -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      metadata: { siteName: 'My Site', title: 'My Site' }
    }),
    tailwindcss(),
  ],
})
```

**Using HTMX + Alpine.js:**
```bash
npm install htmx.org alpinejs
```

```ts
// src/main.ts
import 'htmx.org'
import Alpine from 'alpinejs'
import './style.css'

window.Alpine = Alpine
Alpine.start()
```

```vento
{{/* src/pages/index.vto */}}
{{ layout "layouts/base.vto" }}

<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">Content</div>
</div>

<div hx-get="/api/data" hx-trigger="click">
  Load data
</div>
```

**Or use CDN for quick setup:**
```vento
<!DOCTYPE html>
<html>
<head>
  {{ renderAssets() |> safe }}
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
  {{/* Your content */}}
</body>
</html>
```

### When NOT to Use Vitto

❌ **Complex Web Applications**
- Use Next.js or Remix instead

❌ **Need Server-Side Rendering**
- Use Next.js, Astro (SSR mode), or Remix

❌ **Large E-commerce Sites**
- Use Next.js with a CMS

❌ **Need React/Vue/Svelte Components**
- Use Astro, Next.js, or Gatsby

❌ **Extensive Plugin Ecosystem Needed**
- Use Gatsby or Eleventy

## Migration Guides

### From Next.js to Vitto

**Before (Next.js):**
```tsx
// pages/blog/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts()
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await getPost(params.slug)
  return { props: { post } }
}

export default function Post({ post }) {
  return <article>{/* ... */}</article>
}
```

**After (Vitto):**
```ts
// hooks/posts.ts
export const postsHook = defineHooks('posts', async () => {
  return await getPosts()
})

export const postHook = defineHooks('post', async (params) => {
  return await getPost(params.slug)
})
```

```vento
{{/* src/pages/post.vto */}}
{{ layout "layouts/base.vto" }}
<article>{{/* ... */}}</article>
```

```ts
// vite.config.ts
vitto({
  metadata: { siteName: 'Blog', title: 'Blog' },
  hooks: { posts: postsHook, post: postHook },
  dynamicRoutes: [{
    template: 'post',
    dataSource: 'posts',
    getParams: (p) => ({ slug: p.slug }),
    getPath: (p) => `blog/${p.slug}.html`
  }]
})
```

### From Astro to Vitto

**Before (Astro):**
```astro
---
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { post } = Astro.props
---

<Layout>
  <article>
    <h1>{post.title}</h1>
  </article>
</Layout>
```

**After (Vitto):**
Same as Next.js migration above.

### From Gatsby to Vitto

**Before (Gatsby):**
```javascript
// gatsby-node.js
exports.createPages = async ({ graphql, actions }) => {
  const { data } = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node { fields { slug } }
        }
      }
    }
  `)

  data.allMarkdownRemark.edges.forEach(({ node }) => {
    actions.createPage({
      path: node.fields.slug,
      component: './src/templates/post.js',
      context: { slug: node.fields.slug }
    })
  })
}
```

**After (Vitto):**
Replace GraphQL with simple hooks:
```ts
// hooks/posts.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

export default defineHooks('posts', async () => {
  const postsDir = path.join(process.cwd(), 'content/posts')
  const files = await fs.readdir(postsDir)

  return await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(async file => {
        const content = await fs.readFile(path.join(postsDir, file), 'utf-8')
        const { data, content: markdown } = matter(content)
        return { ...data, slug: file.replace('.md', ''), content: markdown }
      })
  )
})
```

### From Eleventy to Vitto

**Before (Eleventy):**
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection('posts', api =>
    api.getFilteredByGlob('posts/*.md')
  )

  // Manual asset handling
  eleventyConfig.addPassthroughCopy('src/css')
  eleventyConfig.addPassthroughCopy('src/js')
}
```

**After (Vitto):**
```ts
// hooks/posts.ts
import { glob } from 'glob'
import fs from 'node:fs/promises'
import matter from 'gray-matter'

export default defineHooks('posts', async () => {
  const files = await glob('content/posts/*.md')
  return await Promise.all(files.map(async file => {
    const content = await fs.readFile(file, 'utf-8')
    const { data, content: markdown } = matter(content)
    return { ...data, content: markdown }
  }))
})
```

```ts
// vite.config.ts - Assets handled automatically by Vite!
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook } from './hooks/posts'

export default defineConfig({
  plugins: [
    vitto({
      metadata: { siteName: 'My Site', title: 'My Site' },
      hooks: { posts: postsHook }
    })
  ]
  // No need to configure CSS/JS - Vite handles it!
})
```

## Summary

### Choose Vitto When

- ✅ Building blogs, documentation, or content sites
- ✅ Speed and simplicity are priorities
- ✅ You want built-in search
- ✅ You prefer templates over components
- ✅ You need TypeScript support
- ✅ You want minimal JavaScript in the browser
- ✅ You want to use Vite's powerful ecosystem
- ✅ You need easy integration with HTMX, Alpine.js, Tailwind CSS
- ✅ You want fast HMR and modern dev experience
- ✅ You prefer direct configuration over plugins

### Choose Something Else When

- ❌ You need SSR or SSG + SSR hybrid
- ❌ You need React/Vue/Svelte component islands
- ❌ You're building a complex web application
- ❌ You need extensive framework-specific plugin ecosystem
- ❌ You require advanced image optimization out of the box
- ❌ You need GraphQL data layer

## Next Steps

- [Getting Started](./01-getting-started.md) - Set up your first Vitto project
- [Configuration](./03-configuration.md) - Configure Vitto
- [Examples](./10-examples.md) - See real-world examples
- [API Reference](./12-api-reference.md) - Complete API documentation

## Community

Have questions about choosing the right tool?

- 💬 [GitHub Discussions](https://github.com/riipandi/vitto/discussions)
- 🐛 [GitHub Issues](https://github.com/riipandi/vitto/issues)
- 📖 [Documentation](https://github.com/riipandi/vitto/tree/main/docs)
