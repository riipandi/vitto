# Dynamic Routes

Dynamic routes allow you to generate multiple static pages from a single template based on data. This is perfect for blog posts, product pages, documentation, and any content-driven pages.

## Overview

Instead of creating individual `.vto` files for each blog post or product, you can:

1. Create a single template (e.g., `post.vto`)
2. Define a data source (via hooks)
3. Configure how to generate routes from that data
4. Vitto automatically generates all pages during build

## Basic Setup

### 1. Create a Hook for Your Data

Create a hook that provides the data for your pages:

`hooks/posts.ts`:

```ts
import { defineHooks } from 'vitto'

export const postsHook = defineHooks('posts', async () => {
  // Fetch data from API, database, or local files
  return [
    {
      id: 1,
      slug: 'first-post',
      title: 'My First Post',
      content: '<p>Hello world!</p>',
      date: '2024-01-01'
    },
    {
      id: 2,
      slug: 'second-post',
      title: 'My Second Post',
      content: '<p>Another post!</p>',
      date: '2024-01-02'
    }
  ]
})

// Hook for individual post (receives params)
export const postHook = defineHooks('post', async (params) => {
  if (!params?.slug) return null

  const posts = await postsHook()
  return posts.find(p => p.slug === params.slug)
})

export default postsHook
```

### 2. Create a Template

Create a template that will be used for all generated pages:

`src/pages/post.vto`:

```vento
{{ layout "layouts/site.vto" }}

{{ if post }}
  <article>
    <header>
      <h1>{{ post.title }}</h1>
      <time datetime="{{ post.date }}">{{ post.date }}</time>
    </header>

    <div class="content">
      {{ post.content |> safe }}
    </div>
  </article>
{{ else }}
  <div class="error">
    <h1>Post Not Found</h1>
    <a href="/blog.html">← Back to Blog</a>
  </div>
{{ /if }}
```

### 3. Configure Dynamic Routes

In your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook, postHook } from './hooks/posts'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Blog',
        title: 'My Blog'
      },
      hooks: {
        posts: postsHook,
        post: postHook
      },
      dynamicRoutes: [
        {
          template: 'post',           // Template name (without .vto)
          dataSource: 'posts',        // Hook name
          getParams: (post) => ({     // Extract params for the template
            slug: post.slug
          }),
          getPath: (post) => {        // Define output path
            return `blog/${post.slug}.html`
          }
        }
      ]
    })
  ]
})
```

## Configuration Options

### `template`

- **Type**: `string`
- **Required**: Yes

The name of the template file (without `.vto` extension) in your `pagesDir`.

```ts
{
  template: 'post'  // Uses src/pages/post.vto
}
```

### `dataSource`

- **Type**: `string`
- **Required**: Yes

The name of the hook that provides the data array.

```ts
{
  dataSource: 'posts'  // Uses hooks/posts.ts
}
```

### `getParams`

- **Type**: `(item: any) => Record<string, any>`
- **Required**: Yes

Function that extracts parameters from each data item. These params are passed to the template and hook.

```ts
{
  getParams: (post) => ({
    slug: post.slug
  })
}
```

### `getPath`

- **Type**: `(item: any) => string`
- **Required**: Yes

Function that determines the output file path for each page.

```ts
{
  getPath: (post) => `blog/${post.slug}.html`
}
```

The path should include the file extension (`.html`).

## Complete Example

Here's a complete example for a blog with dynamic posts:

### Hook Definition

`hooks/posts.ts`:

```ts
import { defineHooks } from 'vitto'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

// Hook for listing all posts
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
          markdown
        }
      })
  )

  // Sort by date, newest first
  return posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

// Hook for individual post (with params)
export const postHook = defineHooks('post', async (params) => {
  if (!params?.slug) return null

  const filePath = path.join(process.cwd(), 'content/posts', `${params.slug}.md`)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: markdown } = matter(content)

    // Convert markdown to HTML
    const html = await marked(markdown)

    return {
      slug: params.slug,
      title: data.title,
      excerpt: data.excerpt,
      date: data.date,
      author: data.author,
      tags: data.tags || [],
      content: html
    }
  } catch (error) {
    console.error(`Failed to load post: ${params.slug}`, error)
    return null
  }
})

export default postsHook
```

### Template

`src/pages/post.vto`:

```vento
{{ layout "layouts/site.vto" }}

{{ if post }}
  <article class="blog-post">
    <header>
      <h1>{{ post.title }}</h1>

      <div class="meta">
        <time datetime="{{ post.date }}">
          {{ post.date }}
        </time>
        {{ if post.author }}
          <span class="author">by {{ post.author }}</span>
        {{ /if }}
      </div>

      {{ if post.tags && post.tags.length > 0 }}
        <div class="tags">
          {{ for tag of post.tags }}
            <span class="tag">{{ tag }}</span>
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

### Vite Configuration

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'
import { postsHook, postHook } from './hooks/posts'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Blog',
        title: 'My Blog',
        description: 'A blog about web development',
        author: 'John Doe'
      },
      hooks: {
        posts: postsHook,
        post: postHook
      },
      dynamicRoutes: [
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post) => ({
            slug: post.slug
          }),
          getPath: (post) => `blog/${post.slug}.html`
        }
      ]
    })
  ]
})
```

## Advanced Patterns

### Multiple Dynamic Routes

You can define multiple dynamic route configurations:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      metadata: {
        siteName: 'My Site',
        title: 'My Site'
      },
      dynamicRoutes: [
        // Blog posts
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post) => ({ slug: post.slug }),
          getPath: (post) => `blog/${post.slug}.html`
        },
        // Products
        {
          template: 'product',
          dataSource: 'products',
          getParams: (product) => ({ id: product.id }),
          getPath: (product) => `products/${product.slug}.html`
        },
        // Documentation pages
        {
          template: 'doc',
          dataSource: 'docs',
          getParams: (doc) => ({ path: doc.path }),
          getPath: (doc) => `docs/${doc.path}.html`
        }
      ]
    })
  ]
})
```

### Nested Routes

Create nested URL structures:

```ts
{
  template: 'post',
  dataSource: 'posts',
  getParams: (post) => ({ slug: post.slug }),
  getPath: (post) => {
    const date = new Date(post.date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `blog/${year}/${month}/${post.slug}.html`
  }
}
```

This generates URLs like: `/blog/2024/01/my-post.html`

### Pagination

Generate paginated list pages:

`hooks/posts-paginated.ts`:

```ts
import { defineHooks } from 'vitto'

const POSTS_PER_PAGE = 10

export const paginatedPostsHook = defineHooks('paginatedPosts', async () => {
  const allPosts = await postsHook() // Your function to fetch all posts
  const pages = []

  for (let i = 0; i < allPosts.length; i += POSTS_PER_PAGE) {
    const pageNumber = Math.floor(i / POSTS_PER_PAGE) + 1
    const posts = allPosts.slice(i, i + POSTS_PER_PAGE)

    pages.push({
      pageNumber,
      posts,
      hasNext: i + POSTS_PER_PAGE < allPosts.length,
      hasPrev: pageNumber > 1,
      totalPages: Math.ceil(allPosts.length / POSTS_PER_PAGE)
    })
  }

  return pages
})

export default paginatedPostsHook
```

```ts
{
  template: 'blog-page',
  dataSource: 'paginatedPosts',
  getParams: (page) => ({ pageNumber: page.pageNumber }),
  getPath: (page) => {
    return page.pageNumber === 1
      ? 'blog.html'
      : `blog/page-${page.pageNumber}.html`
  }
}
```

### Tag/Category Pages

Generate pages for each tag or category:

`hooks/tags.ts`:

```ts
import { defineHooks } from 'vitto'
import { postsHook } from './posts'

export const tagsHook = defineHooks('tags', async () => {
  const posts = await postsHook()
  const tagMap = new Map()

  posts.forEach(post => {
    post.tags?.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, [])
      }
      tagMap.get(tag).push(post)
    })
  })

  return Array.from(tagMap.entries()).map(([tag, posts]) => ({
    tag,
    slug: tag.toLowerCase().replace(/\s+/g, '-'),
    posts,
    count: posts.length
  }))
})

export const tagHook = defineHooks('tag', async (params) => {
  if (!params?.slug) return null

  const tags = await tagsHook()
  return tags.find(t => t.slug === params.slug)
})

export default tagsHook
```

```ts
{
  template: 'tag',
  dataSource: 'tags',
  getParams: (tag) => ({ slug: tag.slug }),
  getPath: (tag) => `tags/${tag.slug}.html`
}
```

## Best Practices

### 1. Use Descriptive Parameter Names

```ts
// Good
getParams: (post) => ({ slug: post.slug, id: post.id })

// Avoid
getParams: (post) => ({ p: post.slug })
```

### 2. Validate Data in Hooks

```ts
export const postHook = defineHooks('post', async (params) => {
  if (!params?.slug) {
    throw new Error('Slug parameter is required')
  }

  const post = await fetchPost(params.slug)

  if (!post) {
    throw new Error(`Post not found: ${params.slug}`)
  }

  return post
})
```

### 3. Handle Errors Gracefully

```ts
export const postsHook = defineHooks('posts', async () => {
  try {
    return await fetchPosts()
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return [] // Return empty array as fallback
  }
})
```

### 4. Cache Expensive Operations

```ts
let cachedPosts = null

export const postsHook = defineHooks('posts', async () => {
  if (cachedPosts) {
    return cachedPosts
  }

  cachedPosts = await fetchPosts()
  return cachedPosts
})
```

### 5. Use Consistent URL Structures

```ts
// Good - consistent structure
getPath: (post) => `blog/${post.slug}.html`
getPath: (product) => `products/${product.slug}.html`

// Avoid - inconsistent
getPath: (post) => `${post.slug}.html`
getPath: (product) => `p/${product.id}.html`
```

### 6. Export Hooks Properly

```ts
// Good - export both named and default
export const postsHook = defineHooks('posts', async () => { /* ... */ })
export const postHook = defineHooks('post', async (params) => { /* ... */ })
export default postsHook

// Then import in config
import { postsHook, postHook } from './hooks/posts'
```

## Troubleshooting

### Pages Not Generated

Check that:
1. Your hook returns an array of items
2. `template` matches your template filename (without `.vto`)
3. `dataSource` matches your hook name
4. `getPath` returns a valid file path with extension
5. Hooks are properly registered in the `hooks` option

### Data Not Available in Template

Ensure:
1. Hook is properly defined and registered
2. Parameters are correctly extracted in `getParams`
3. Hook accepts and uses the params correctly
4. Hook returns data in the expected format

### Build Errors

Common issues:
- Missing template file
- Hook returning `null` or `undefined`
- Invalid characters in generated file paths
- Circular dependencies between hooks
- Missing required `metadata` in config

## Next Steps

- [Hooks System](./06-hooks.md) - Learn more about creating and using hooks
- [Search Integration](./07-search.md) - Add search functionality
- [Deployment](./08-deployment.md) - Deploy your static site
