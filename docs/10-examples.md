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
├── hooks/
│   ├── posts.ts
│   └── tags.ts
└── vite.config.ts
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

  try {
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
  } catch (error) {
    console.error(`Failed to load post: ${params.slug}`, error)
    return null
  }
})

export default postsHook
```

`hooks/tags.ts`:

```ts
import { defineHooks } from 'vitto'
import { postsHook } from './posts'

export const tagsHook = defineHooks('tags', async () => {
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

export const tagHook = defineHooks('tag', async (params) => {
  if (!params?.slug) return null

  const tags = await tagsHook()
  return tags.find(t => t.slug === params.slug)
})

export default tagsHook
```

### Templates

`src/pages/blog.vto`:

```vento
{{ layout "layouts/base.vto" }}

<div class="container">
  <h1>{{ metadata.siteName }} Blog</h1>

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
{{ layout "layouts/base.vto" }}

{{ if post }}
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
{{ else }}
  <div class="error">
    <h1>Post Not Found</h1>
    <p>The post you're looking for doesn't exist.</p>
    <a href="/blog.html">← Back to Blog</a>
  </div>
{{ /if }}
```

`src/pages/tag.vto`:

```vento
{{ layout "layouts/base.vto" }}

{{ if tag }}
  <div class="container">
    <h1>Posts tagged "{{ tag.name }}"</h1>
    <p>{{ tag.count }} post{{ tag.count !== 1 ? 's' : '' }}</p>

    <div class="posts-grid">
      {{ for post of tag.posts }}
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
{{ else }}
  <div class="error">
    <h1>Tag Not Found</h1>
    <a href="/blog.html">← Back to Blog</a>
  </div>
{{ /if }}
```

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook, postHook } from './hooks/posts'
import { tagsHook, tagHook } from './hooks/tags'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Blog',
        title: 'My Awesome Blog',
        description: 'A blog about web development',
        author: 'John Doe',
        keywords: ['blog', 'web development', 'vitto']
      },
      hooks: {
        posts: postsHook,
        post: postHook,
        tags: tagsHook,
        tag: tagHook
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
      ],
      minify: process.env.NODE_ENV === 'production'
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

interface DocItem {
  type: 'file' | 'directory'
  name?: string
  slug?: string
  title?: string
  order?: number
  children?: DocItem[]
}

export const docsHook = defineHooks('docs', async () => {
  const docsDir = path.join(process.cwd(), 'content/docs')

  async function readDocs(dir: string): Promise<DocItem[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const docs: DocItem[] = []

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

    return docs.sort((a, b) => (a.order || 999) - (b.order || 999))
  }

  return await readDocs(docsDir)
})

export const docHook = defineHooks('doc', async (params) => {
  if (!params?.path) return null

  const filePath = path.join(process.cwd(), 'content/docs', `${params.path}.md`)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: markdown } = matter(content)

    return {
      title: data.title,
      order: data.order,
      content: await marked(markdown)
    }
  } catch (error) {
    console.error(`Failed to load doc: ${params.path}`, error)
    return null
  }
})

export default docsHook
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

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { docsHook, docHook } from './hooks/docs'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Docs',
        title: 'Documentation',
        description: 'Project documentation'
      },
      hooks: {
        docs: docsHook,
        doc: docHook
      },
      dynamicRoutes: [
        {
          template: 'doc',
          dataSource: 'docs',
          getParams: (doc) => ({ path: doc.slug }),
          getPath: (doc) => `docs${doc.slug}.html`
        }
      ]
    })
  ]
})
```

## Portfolio Website

Create a portfolio with project showcases.

### Hooks

`hooks/projects.ts`:

```ts
import { defineHooks } from 'vitto'

interface Project {
  id: number
  slug: string
  title: string
  description: string
  image: string
  tags: string[]
  url: string
  github?: string
  featured: boolean
}

export const projectsHook = defineHooks<Project[]>('projects', () => {
  return [
    {
      id: 1,
      slug: 'ecommerce-platform',
      title: 'E-commerce Platform',
      description: 'A full-featured e-commerce solution built with modern technologies',
      image: '/images/projects/ecommerce.jpg',
      tags: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      url: 'https://example.com',
      github: 'https://github.com/user/ecommerce',
      featured: true
    },
    {
      id: 2,
      slug: 'mobile-app',
      title: 'Mobile App',
      description: 'Cross-platform mobile application with real-time features',
      image: '/images/projects/mobile.jpg',
      tags: ['React Native', 'Firebase', 'Redux'],
      url: 'https://example.com',
      github: 'https://github.com/user/mobile-app',
      featured: true
    },
    {
      id: 3,
      slug: 'design-system',
      title: 'Design System',
      description: 'Comprehensive UI component library',
      image: '/images/projects/design-system.jpg',
      tags: ['React', 'Storybook', 'CSS'],
      url: 'https://example.com',
      featured: false
    }
  ]
})

export const projectHook = defineHooks<Project | null, { slug: string }>('project', async (params) => {
  if (!params?.slug) return null

  const projects = await projectsHook()
  return projects.find(p => p.slug === params.slug) || null
})

export default projectsHook
```

### Template

`src/pages/index.vto`:

```vento
{{ layout "layouts/base.vto" }}

<section class="hero">
  <h1>Hi, I'm {{ metadata.author }}</h1>
  <p>Web Developer & Designer</p>
  <p>{{ metadata.description }}</p>
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
            <a href="{{ project.url }}" target="_blank" rel="noopener">View Project</a>
            {{ if project.github }}
              <a href="{{ project.github }}" target="_blank" rel="noopener">GitHub</a>
            {{ /if }}
          </div>
        </article>
      {{ /if }}
    {{ /for }}
  </div>
</section>
```

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { projectsHook, projectHook } from './hooks/projects'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'John Doe Portfolio',
        title: 'John Doe - Web Developer',
        description: 'Full-stack web developer specializing in React and Node.js',
        author: 'John Doe',
        keywords: ['portfolio', 'web developer', 'react', 'nodejs']
      },
      hooks: {
        projects: projectsHook,
        project: projectHook
      },
      dynamicRoutes: [
        {
          template: 'project',
          dataSource: 'projects',
          getParams: (project) => ({ slug: project.slug }),
          getPath: (project) => `projects/${project.slug}.html`
        }
      ]
    })
  ]
})
```

## E-commerce Product Catalog

Build a product catalog with categories.

### Hooks

`hooks/products.ts`:

```ts
import { defineHooks } from 'vitto'

interface Product {
  id: number
  slug: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sku: string
  inStock: boolean
}

export const productsHook = defineHooks<Product[]>('products', async () => {
  try {
    const response = await fetch('https://api.example.com/products')
    if (!response.ok) throw new Error('Failed to fetch products')
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
})

export const productHook = defineHooks<Product | null, { id: string }>('product', async (params) => {
  if (!params?.id) return null

  try {
    const response = await fetch(`https://api.example.com/products/${params.id}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch product ${params.id}:`, error)
    return null
  }
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

export default productsHook
```

### Product Page

`src/pages/product.vto`:

```vento
{{ layout "layouts/base.vto" }}

{{ if product }}
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
        <span class="{{ product.inStock ? 'in-stock' : 'out-of-stock' }}">
          {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
        </span>
      </div>

      {{ if product.inStock }}
        <button class="add-to-cart">Add to Cart</button>
      {{ /if }}
    </div>
  </div>
{{ else }}
  <div class="error">
    <h1>Product Not Found</h1>
    <a href="/products.html">← Back to Products</a>
  </div>
{{ /if }}
```

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { productsHook, productHook, categoriesHook } from './hooks/products'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Shop',
        title: 'My Shop - Quality Products',
        description: 'Shop quality products at great prices',
        keywords: ['shop', 'ecommerce', 'products']
      },
      hooks: {
        products: productsHook,
        product: productHook,
        categories: categoriesHook
      },
      dynamicRoutes: [
        {
          template: 'product',
          dataSource: 'products',
          getParams: (product) => ({ id: product.id }),
          getPath: (product) => `products/${product.slug}.html`
        }
      ]
    })
  ]
})
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
    readMore: 'Read More',
    welcome: 'Welcome to our site'
  },
  es: {
    home: 'Inicio',
    about: 'Acerca de',
    contact: 'Contacto',
    readMore: 'Leer Más',
    welcome: 'Bienvenido a nuestro sitio'
  },
  fr: {
    home: 'Accueil',
    about: 'À propos',
    contact: 'Contact',
    readMore: 'Lire la suite',
    welcome: 'Bienvenue sur notre site'
  }
}

export default defineHooks('i18n', (params) => {
  const lang = params?.lang || 'en'
  return translations[lang] || translations.en
})
```

### Template

`src/pages/index.vto`:

```vento
{{ layout "layouts/base.vto" }}

<nav>
  <a href="/">{{ i18n.home }}</a>
  <a href="/about.html">{{ i18n.about }}</a>
  <a href="/contact.html">{{ i18n.contact }}</a>
</nav>

<div class="language-switcher">
  <a href="/">English</a>
  <a href="/es/">Español</a>
  <a href="/fr/">Français</a>
</div>

<main>
  <h1>{{ i18n.welcome }}</h1>
  <h2>{{ metadata.siteName }}</h2>
  <p>{{ metadata.description }}</p>
</main>
```

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import i18nHook from './hooks/i18n'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Multilingual Site',
        title: 'Welcome',
        description: 'A site available in multiple languages'
      },
      hooks: {
        i18n: i18nHook
      }
    })
  ]
})
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
  const baseUrl = 'https://example.com'

  const items = posts.slice(0, 20).map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}.html</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/blog/${post.slug}.html</guid>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My Blog</title>
    <link>${baseUrl}</link>
    <description>Latest blog posts</description>
    <language>en</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
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

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import rssHook from './hooks/rss'
import { postsHook, postHook } from './hooks/posts'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Blog',
        title: 'My Blog',
        description: 'A blog about web development'
      },
      hooks: {
        posts: postsHook,
        post: postHook,
        rss: rssHook
      }
    })
  ]
})
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
  const baseUrl = 'https://example.com'

  const urls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/about.html`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/blog.html`, priority: '0.9', changefreq: 'daily' },
    ...posts.map(post => ({
      loc: `${baseUrl}/blog/${post.slug}.html`,
      lastmod: post.date,
      priority: '0.7',
      changefreq: 'weekly'
    }))
  ]

  const urlElements = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')

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

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import sitemapHook from './hooks/sitemap'
import { postsHook, postHook } from './hooks/posts'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site',
        description: 'A website built with Vitto'
      },
      hooks: {
        posts: postsHook,
        post: postHook,
        sitemap: sitemapHook
      }
    })
  ]
})
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
    version: '1.0',
    generated: new Date().toISOString(),
    posts: posts.map(post => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      author: post.author,
      tags: post.tags,
      url: `/blog/${post.slug}.html`
    }))
  }, null, 2)
})
```

### Template

`src/pages/api/posts.json.vto`:

```vento
{{ api |> safe }}
```

### Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import apiHook from './hooks/api'
import { postsHook, postHook } from './hooks/posts'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Blog',
        title: 'My Blog',
        description: 'A blog with JSON API'
      },
      hooks: {
        posts: postsHook,
        post: postHook,
        api: apiHook
      }
    })
  ]
})
```

## Next Steps

- [Troubleshooting](./11-troubleshooting.md) - Common issues and solutions
- [API Reference](./12-api-reference.md) - Complete API documentation
- [Contributing](./13-contributing.md) - Contribute to Vitto
