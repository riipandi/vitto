# Hooks System

Hooks are functions that fetch or generate dynamic data to inject into your templates. They enable you to pull content from APIs, databases, files, or any other data source.

## Overview

Hooks allow you to:

- Fetch data from external APIs
- Read content from local files (Markdown, JSON, etc.)
- Query databases
- Generate dynamic content
- Share data across multiple pages
- Pass parameters for filtering or customization

## Creating a Hook

Use the `defineHooks` helper to create a hook:

```ts
import { defineHooks } from 'vitto'

export default defineHooks('hookName', async (params) => {
  // Fetch or generate your data
  return data
})
```

### Basic Example

`hooks/site.ts`:

```ts
import { defineHooks } from 'vitto'

export default defineHooks('site', () => {
  return {
    name: 'My Awesome Site',
    description: 'A site built with Vitto',
    author: 'John Doe',
    social: {
      twitter: '@johndoe',
      github: 'johndoe'
    }
  }
})
```

## Using Hooks

### 1. Register the Hook

In your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import siteHook from './hooks/site'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      },
      hooks: {
        site: siteHook
      }
    })
  ]
})
```

### 2. Access Data in Templates

The hook data is available in templates using the hook name:

```vento
<footer>
  <p>&copy; {{ site.name }} by {{ site.author }}</p>
  <a href="https://twitter.com/{{ site.social.twitter }}">Twitter</a>
</footer>
```

## Hook Types

### Static Hooks

Return the same data for all pages:

```ts
export default defineHooks('navigation', () => {
  return [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about.html' },
    { label: 'Blog', url: '/blog.html' }
  ]
})
```

### Async Hooks

Fetch data asynchronously:

```ts
export default defineHooks('posts', async () => {
  const response = await fetch('https://api.example.com/posts')
  return response.json()
})
```

### Parameterized Hooks

Accept parameters for filtering or customization:

```ts
export default defineHooks('post', async (params) => {
  if (!params?.slug) return null

  const response = await fetch(`https://api.example.com/posts/${params.slug}`)
  return response.json()
})
```

Use with dynamic routes:

```ts
// vite.config.ts
vitto({
  metadata: {
    siteName: 'My Blog',
    title: 'My Blog'
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

## Common Use Cases

### Reading Markdown Files

`hooks/posts.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

export default defineHooks('posts', async () => {
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
          ...data,
          content: markdown
        }
      })
  )

  return posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})
```

### Fetching from an API

`hooks/products.ts`:

```ts
import { defineHooks } from 'vitto'

export default defineHooks('products', async () => {
  try {
    const response = await fetch('https://api.example.com/products')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const products = await response.json()
    return products
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
})
```

### Reading JSON Files

`hooks/data.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineHooks('data', async () => {
  const filePath = path.join(process.cwd(), 'data', 'config.json')
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
})
```

### Processing Images

`hooks/gallery.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineHooks('gallery', async () => {
  const imagesDir = path.join(process.cwd(), 'public/images/gallery')
  const files = await fs.readdir(imagesDir)

  return files
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .map(file => ({
      filename: file,
      url: `/images/gallery/${file}`,
      alt: file.replace(/\.[^.]+$/, '').replace(/-/g, ' ')
    }))
})
```

### Environment-Based Data

`hooks/config.ts`:

```ts
import { defineHooks } from 'vitto'

export default defineHooks('config', () => {
  return {
    apiUrl: process.env.VITE_API_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    enableAnalytics: process.env.NODE_ENV === 'production',
    version: process.env.npm_package_version || '1.0.0'
  }
})
```

## Advanced Patterns

### Caching Hook Results

```ts
let cache: any = null
let cacheTime = 0
const CACHE_DURATION = 60000 // 1 minute

export default defineHooks('data', async () => {
  const now = Date.now()

  if (cache && (now - cacheTime) < CACHE_DURATION) {
    return cache
  }

  cache = await fetchExpensiveData()
  cacheTime = now

  return cache
})
```

### Combining Multiple Data Sources

```ts
export default defineHooks('combined', async () => {
  const [posts, products, users] = await Promise.all([
    fetch('https://api.example.com/posts').then(r => r.json()),
    fetch('https://api.example.com/products').then(r => r.json()),
    fetch('https://api.example.com/users').then(r => r.json())
  ])

  return {
    posts,
    products,
    users
  }
})
```

### Transforming Data

```ts
export default defineHooks('posts', async () => {
  const rawPosts = await fetchPosts()

  return rawPosts.map(post => ({
    ...post,
    // Add computed fields
    excerpt: post.content.substring(0, 200) + '...',
    readingTime: Math.ceil(post.content.split(' ').length / 200),
    formattedDate: new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }))
})
```

### Filtering and Sorting

```ts
export default defineHooks('featuredPosts', async () => {
  const allPosts = await getAllPosts()

  return allPosts
    .filter(post => post.featured === true)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5) // Top 5 featured posts
})
```

### Nested Relationships

```ts
export default defineHooks('postsWithAuthors', async () => {
  const posts = await fetchPosts()
  const authors = await fetchAuthors()

  return posts.map(post => ({
    ...post,
    author: authors.find(author => author.id === post.authorId)
  }))
})
```

## Hook Organization

### File Structure

Organize hooks by purpose:

```
hooks/
├── content/
│   ├── posts.ts
│   ├── pages.ts
│   └── docs.ts
├── data/
│   ├── site.ts
│   ├── navigation.ts
│   └── config.ts
└── external/
    ├── api.ts
    └── cms.ts
```

### Exporting Multiple Hooks

You can export multiple hooks from a single file:

`hooks/blog.ts`:

```ts
import { defineHooks } from 'vitto'

export const postsHook = defineHooks('posts', async () => {
  // Fetch all posts
  return await fetchAllPosts()
})

export const postHook = defineHooks('post', async (params) => {
  // Fetch single post
  return await fetchPost(params.slug)
})

export const categoriesHook = defineHooks('categories', async () => {
  // Fetch categories
  return await fetchCategories()
})
```

Then register all at once:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook, postHook, categoriesHook } from './hooks/blog'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Blog',
        title: 'My Blog'
      },
      hooks: {
        posts: postsHook,
        post: postHook,
        categories: categoriesHook
      }
    })
  ]
})
```

## Type Safety

Add TypeScript types for better IDE support:

```ts
import { defineHooks } from 'vitto'

interface Post {
  id: number
  slug: string
  title: string
  content: string
  date: string
  author: string
}

export default defineHooks<Post[]>('posts', async () => {
  const posts: Post[] = await fetchPosts()
  return posts
})
```

With parameters:

```ts
interface PostParams {
  slug: string
}

export default defineHooks<Post, PostParams>('post', async (params) => {
  if (!params?.slug) {
    throw new Error('Slug is required')
  }

  const post: Post = await fetchPost(params.slug)
  return post
})
```

## Best Practices

### 1. Handle Errors Gracefully

```ts
export default defineHooks('data', async () => {
  try {
    return await fetchData()
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return [] // Return safe default
  }
})
```

### 2. Validate Parameters

```ts
export default defineHooks('item', async (params) => {
  if (!params?.id) {
    throw new Error('ID parameter is required')
  }

  if (typeof params.id !== 'number') {
    throw new Error('ID must be a number')
  }

  return await fetchItem(params.id)
})
```

### 3. Use Meaningful Names

```ts
// Good
defineHooks('blogPosts', ...)
defineHooks('featuredProducts', ...)
defineHooks('navigationMenu', ...)

// Avoid
defineHooks('data', ...)
defineHooks('items', ...)
defineHooks('stuff', ...)
```

### 4. Document Your Hooks

```ts
/**
 * Fetches all published blog posts, sorted by date (newest first).
 * Posts are read from the content/posts directory.
 *
 * @returns Array of post objects with frontmatter and content
 */
export default defineHooks('posts', async () => {
  // Implementation
})
```

### 5. Keep Hooks Focused

```ts
// Good - single responsibility
export const postsHook = defineHooks('posts', async () => {
  return await fetchPosts()
})

export const categoriesHook = defineHooks('categories', async () => {
  return await fetchCategories()
})

// Avoid - doing too much
export const everythingHook = defineHooks('everything', async () => {
  const posts = await fetchPosts()
  const categories = await fetchCategories()
  const users = await fetchUsers()
  const comments = await fetchComments()
  // Too much!
})
```

### 6. Export Both Named and Default

```ts
// Good practice for better imports
export const postsHook = defineHooks('posts', async () => {
  return await fetchPosts()
})

export default postsHook
```

## Debugging Hooks

### Log Hook Data

```ts
export default defineHooks('posts', async () => {
  const posts = await fetchPosts()
  console.log(`Loaded ${posts.length} posts`)
  return posts
})
```

### Validate Data Structure

```ts
export default defineHooks('posts', async () => {
  const posts = await fetchPosts()

  posts.forEach((post, index) => {
    if (!post.title || !post.slug) {
      console.warn(`Post at index ${index} is missing required fields`, post)
    }
  })

  return posts
})
```

### Development vs Production

```ts
export default defineHooks('data', async () => {
  const data = await fetchData()

  if (process.env.NODE_ENV === 'development') {
    console.log('Hook data:', JSON.stringify(data, null, 2))
  }

  return data
})
```

## Complete Example

Here's a complete example showing hooks in action:

`hooks/blog.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

export const postsHook = defineHooks('posts', async () => {
  const postsDir = path.join(process.cwd(), 'content/posts')
  const files = await fs.readdir(postsDir)

  const posts = await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(async (file) => {
        const content = await fs.readFile(path.join(postsDir, file), 'utf-8')
        const { data } = matter(content)
        return {
          slug: file.replace('.md', ''),
          ...data
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
    ...data,
    content: markdown
  }
})

export default postsHook
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook, postHook } from './hooks/blog'

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
        post: postHook
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
  ]
})
```

## Next Steps

- [Dynamic Routes](./05-dynamic-routes.md) - Use hooks with dynamic routes
- [Search Integration](./07-search.md) - Add search functionality
- [Deployment](./08-deployment.md) - Deploy your site
