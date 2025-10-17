# Examples

This guide provides real-world examples and common use cases for building sites with Vitto.

## Table of Contents

- [Blog with Markdown](#blog-with-markdown)
- [Documentation Site](#documentation-site)
- [Portfolio Website](#portfolio-website)
- [E-commerce Product Catalog](#e-commerce-product-catalog)
- [Multi-language Site](#multi-language-site)
- [RSS Feed](#rss-feed)
- [Sitemap Generation](#sitemap-generation)
- [JSON API](#json-api)

## Blog with Markdown

A complete blog implementation with posts, categories, and tags.

### Project Structure

```
blog/
├── content/
│   └── posts/
│       ├── first-post.md
│       └── second-post.md
├── src/
│   ├── pages/
│   │   ├── index.vto
│   │   ├── blog.vto
│   │   ├── post.vto
│   │   └── tag.vto
│   ├── layouts/
│   │   └── base.vto
│   └── partials/
│       ├── header.vto
│       └── post-card.vto
└── hooks/
    ├── posts.ts
    └── tags.ts
```

### Markdown Post

`content/posts/first-post.md`:

```markdown
---
title: Getting Started with Vitto
excerpt: Learn how to build static sites with Vitto
date: 2024-01-15
author: John Doe
tags:
  - vitto
  - static-site
  - tutorial
---

# Getting Started with Vitto

This is my first blog post built with Vitto...
```

### Hooks

`hooks/posts.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

export const postsHook = defineHooks('posts', async () => {
  const postsDir = path.join(process.cwd(), 'content/posts')
  const files = await fs.readdir(postsDir)

  const posts = await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(async (file) => {
        const filePath = path.join(postsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const { data, content: markdown } = matter(content)

        return {
          slug: file.replace('.md', ''),
          title: data.title,
          excerpt: data.excerpt,
          date: data.date,
          author: data.author,
          tags: data.tags || [],
          content: await marked(markdown)
        }
      })
  )

  return posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

export const postHook = defineHooks('post', async (params) => {
  if (!params?.slug) return null

  const filePath = path.join(process.cwd(), 'content/posts', `${params.slug}.md`)
  const content = await fs.readFile(filePath, 'utf-8')
  const { data, content: markdown } = matter(content)

  return {
    slug: params.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    author: data.author,
    tags: data.tags || [],
    content: await marked(markdown)
  }
})

export default postsHook
```

`hooks/tags.ts`:

```ts
import { defineHooks } from 'vitto'

export default defineHooks('tags', async () => {
  const postsHook = (await import('./posts')).default
  const posts = await postsHook()

  const tagMap = new Map()

  posts.forEach(post => {
    post.tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, [])
      }
      tagMap.get(tag).push(post)
    })
  })

  return Array.from(tagMap.entries()).map(([name, posts]) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    count: posts.length,
    posts
  }))
})
```

### Templates

`src/pages/blog.vto`:

```vento
{{ set title = "Blog" }}
{{ layout "layouts/site.vto" }}

<div class="container">
  <h1>{{ title }}</h1>

  <div class="posts-grid">
    {{ for post of posts }}
      {{ include "partials/post-card.vto" {
        title: post.title,
        excerpt: post.excerpt,
        date: post.date,
        author: post.author,
        url: `/blog/${post.slug}.html`
      } }}
    {{ /for }}
  </div>
</div>
```

`src/pages/post.vto`:

```vento
{{ set title = post ? post.title : "Post Not Found" }}
{{ layout "layouts/site.vto" }}

<article class="blog-post">
  <header>
    <h1>{{ post.title }}</h1>
    <div class="meta">
      <time datetime="{{ post.date }}">{{ post.date }}</time>
      <span>by {{ post.author }}</span>
    </div>

    {{ if post.tags && post.tags.length > 0 }}
      <div class="tags">
        {{ for tag of post.tags }}
          <a href="/tags/{{ tag |> lowercase |> replace(' ', '-') }}.html">
            {{ tag }}
          </a>
        {{ /for }}
      </div>
    {{ /if }}
  </header>

  <div class="content">
    {{ post.content |> safe }}
  </div>

  <footer>
    <a href="/blog.html">← Back to Blog</a>
  </footer>
</article>
```

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook, postHook } from './hooks/posts'
import tagsHook from './hooks/tags'

export default defineConfig({
  plugins: [
    vitto({
      hooks: {
        posts: postsHook,
        post: postHook,
        tags: tagsHook
      },
      dynamicRoutes: [
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post) => ({ slug: post.slug }),
          getPath: (post) => `blog/${post.slug}.html`
        },
        {
          template: 'tag',
          dataSource: 'tags',
          getParams: (tag) => ({ slug: tag.slug }),
          getPath: (tag) => `tags/${tag.slug}.html`
        }
      ]
    })
  ]
})
```

## Documentation Site

Build a documentation site with sidebar navigation.

### Hooks

`hooks/docs.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

export default defineHooks('docs', async () => {
  const docsDir = path.join(process.cwd(), 'content/docs')

  async function readDocs(dir: string): Promise<any[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const docs = []

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        const children = await readDocs(fullPath)
        docs.push({
          type: 'directory',
          name: entry.name,
          children
        })
      } else if (entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8')
        const { data } = matter(content)

        docs.push({
          type: 'file',
          slug: fullPath.replace(docsDir, '').replace('.md', ''),
          title: data.title,
          order: data.order || 999
        })
      }
    }

    return docs.sort((a, b) => a.order - b.order)
  }

  return await readDocs(docsDir)
})
```

### Sidebar Component

`src/partials/docs-sidebar.vto`:

```vento
<aside class="docs-sidebar">
  <nav>
    {{ for item of docs }}
      {{ if item.type === 'directory' }}
        <div class="nav-section">
          <h3>{{ item.name }}</h3>
          <ul>
            {{ for doc of item.children }}
              <li>
                <a href="/docs{{ doc.slug }}.html">{{ doc.title }}</a>
              </li>
            {{ /for }}
          </ul>
        </div>
      {{ else }}
        <a href="/docs{{ item.slug }}.html">{{ item.title }}</a>
      {{ /if }}
    {{ /for }}
  </nav>
</aside>
```

## Portfolio Website

Create a portfolio with project showcases.

### Hooks

`hooks/projects.ts`:

```ts
import { defineHooks } from 'vitto'

export default defineHooks('projects', () => {
  return [
    {
      id: 1,
      title: 'E-commerce Platform',
      description: 'A full-featured e-commerce solution',
      image: '/images/projects/ecommerce.jpg',
      tags: ['React', 'Node.js', 'MongoDB'],
      url: 'https://example.com',
      github: 'https://github.com/user/project',
      featured: true
    },
    {
      id: 2,
      title: 'Mobile App',
      description: 'Cross-platform mobile application',
      image: '/images/projects/mobile.jpg',
      tags: ['React Native', 'Firebase'],
      url: 'https://example.com',
      featured: false
    }
  ]
})
```

### Template

`src/pages/index.vto`:

```vento
{{ set title = "Portfolio" }}
{{ layout "layouts/site.vto" }}

<section class="hero">
  <h1>Hi, I'm John Doe</h1>
  <p>Web Developer & Designer</p>
</section>

<section class="projects">
  <h2>Featured Projects</h2>

  <div class="projects-grid">
    {{ for project of projects }}
      {{ if project.featured }}
        <article class="project-card">
          <img src="{{ project.image }}" alt="{{ project.title }}">
          <h3>{{ project.title }}</h3>
          <p>{{ project.description }}</p>

          <div class="tags">
            {{ for tag of project.tags }}
              <span class="tag">{{ tag }}</span>
            {{ /for }}
          </div>

          <div class="links">
            <a href="{{ project.url }}">View Project</a>
            {{ if project.github }}
              <a href="{{ project.github }}">GitHub</a>
            {{ /if }}
          </div>
        </article>
      {{ /if }}
    {{ /for }}
  </div>
</section>
```

## E-commerce Product Catalog

Build a product catalog with categories.

### Hooks

`hooks/products.ts`:

```ts
import { defineHooks } from 'vitto'

export const productsHook = defineHooks('products', async () => {
  // Fetch from API or database
  const response = await fetch('https://api.example.com/products')
  return response.json()
})

export const productHook = defineHooks('product', async (params) => {
  if (!params?.id) return null

  const response = await fetch(`https://api.example.com/products/${params.id}`)
  return response.json()
})

export const categoriesHook = defineHooks('categories', async () => {
  const products = await productsHook()

  const categoryMap = new Map()
  products.forEach(product => {
    if (!categoryMap.has(product.category)) {
      categoryMap.set(product.category, [])
    }
    categoryMap.get(product.category).push(product)
  })

  return Array.from(categoryMap.entries()).map(([name, products]) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    count: products.length,
    products
  }))
})
```

### Product Page

`src/pages/product.vto`:

```vento
{{ set title = product.name }}
{{ layout "layouts/site.vto" }}

<div class="product">
  <div class="product-images">
    <img src="{{ product.image }}" alt="{{ product.name }}">
  </div>

  <div class="product-info">
    <h1>{{ product.name }}</h1>
    <p class="price">${{ product.price }}</p>
    <p>{{ product.description }}</p>

    <div class="product-meta">
      <span>Category: {{ product.category }}</span>
      <span>SKU: {{ product.sku }}</span>
    </div>

    <button class="add-to-cart">Add to Cart</button>
  </div>
</div>
```

## Multi-language Site

Create a multi-language site with i18n support.

### Hooks

`hooks/i18n.ts`:

```ts
import { defineHooks } from 'vitto'

const translations = {
  en: {
    home: 'Home',
    about: 'About',
    contact: 'Contact',
    readMore: 'Read More'
  },
  es: {
    home: 'Inicio',
    about: 'Acerca de',
    contact: 'Contacto',
    readMore: 'Leer Más'
  }
}

export default defineHooks('i18n', (params) => {
  const lang = params?.lang || 'en'
  return translations[lang]
})
```

### Template

`src/pages/index.vto`:

```vento
{{ set title = "Welcome" }}
{{ layout "layouts/site.vto" }}

<nav>
  <a href="/">{{ i18n.home }}</a>
  <a href="/about.html">{{ i18n.about }}</a>
  <a href="/contact.html">{{ i18n.contact }}</a>
</nav>

<main>
  <h1>{{ title }}</h1>
  <p>Content in {{ lang }}</p>
</main>
```

## RSS Feed

Generate an RSS feed for your blog.

### Hook

`hooks/rss.ts`:

```ts
import { defineHooks } from 'vitto'
import { postsHook } from './posts'

export default defineHooks('rss', async () => {
  const posts = await postsHook()

  const items = posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>https://example.com/blog/${post.slug}.html</link>
      <description>${post.excerpt}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://example.com</link>
    <description>Blog posts</description>
    ${items}
  </channel>
</rss>`
})
```

### Template

`src/pages/feed.xml.vto`:

```vento
{{ rss |> safe }}
```

## Sitemap Generation

Generate a sitemap.xml file.

### Hook

`hooks/sitemap.ts`:

```ts
import { defineHooks } from 'vitto'
import { postsHook } from './posts'

export default defineHooks('sitemap', async () => {
  const posts = await postsHook()

  const urls = [
    { loc: 'https://example.com/', priority: '1.0' },
    { loc: 'https://example.com/about.html', priority: '0.8' },
    ...posts.map(post => ({
      loc: `https://example.com/blog/${post.slug}.html`,
      lastmod: post.date,
      priority: '0.7'
    }))
  ]

  const urlElements = urls.map(url => `
    <url>
      <loc>${url.loc}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      <priority>${url.priority}</priority>
    </url>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlElements}
</urlset>`
})
```

### Template

`src/pages/sitemap.xml.vto`:

```vento
{{ sitemap |> safe }}
```

## JSON API

Generate JSON files for API consumption.

### Hook

`hooks/api.ts`:

```ts
import { defineHooks } from 'vitto'
import { postsHook } from './posts'

export default defineHooks('api', async () => {
  const posts = await postsHook()

  return JSON.stringify({
    posts: posts.map(post => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      author: post.author
    }))
  }, null, 2)
})
```

### Template

`src/pages/api/posts.json.vto`:

```vento
{{ api |> safe }}
```

## Next Steps

- [Troubleshooting](./11-troubleshooting.md) - Common issues and solutions
- [API Reference](./12-api-reference.md) - Complete API documentation
- [Contributing](./13-contributing.md) - Contribute to Vitto
