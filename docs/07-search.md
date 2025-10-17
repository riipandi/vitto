# Search Integration

Vitto includes built-in search functionality powered by [Pagefind](https://pagefind.app/), a fully static search library that requires no backend infrastructure.

## Overview

Pagefind automatically:
- Indexes your site content during build
- Generates a lightweight search index
- Provides a fast, client-side search experience
- Works entirely offline
- Requires no server or API

## Basic Setup

Search indexing is enabled by default. During production builds, Vitto automatically generates a search index.

### 1. Enable Search (Default Configuration)

In your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      enableSearchIndex: true // Default: true
    })
  ]
})
```

### 2. Add Search UI to Your Site

Create a search component in your templates:

`src/partials/search.vto`:

```vento
<div class="search-container">
  <div id="search"></div>
</div>

<script>
  window.addEventListener('DOMContentLoaded', () => {
    new PagefindUI({
      element: "#search",
      showSubResults: true,
      showImages: false
    })
  })
</script>

<link href="/_pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/_pagefind/pagefind-ui.js"></script>
```

### 3. Include in Your Layout

`src/layouts/base.vto`:

```vento
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  {{ renderAssets() |> safe }}
</head>
<body>
  {{ include "partials/header.vto" }}

  {{# Add search component #}}
  {{ include "partials/search.vto" }}

  <main>
    {{ content |> safe }}
  </main>

  {{ include "partials/footer.vto" }}
</body>
</html>
```

## Configuration Options

### Basic Options

```ts
vitto({
  enableSearchIndex: true,
  pagefindOptions: {
    rootSelector: 'html',
    verbose: false,
    keepIndexUrl: true,
    writePlayground: false
  }
})
```

### Advanced Pagefind Options

```ts
vitto({
  pagefindOptions: {
    // Element to index (default: 'html')
    rootSelector: 'main',

    // Exclude elements from indexing
    excludeSelectors: ['.no-index', 'nav', 'footer'],

    // Show detailed indexing logs
    verbose: true,

    // Keep index URL structure
    keepIndexUrl: true,

    // Generate interactive playground (development only)
    writePlayground: false,

    // Force language
    forceLanguage: 'en',

    // Glob patterns to process
    glob: '**/*.{html}'
  }
})
```

## Customizing Search Behavior

### Mark Content as Searchable

Use `data-pagefind-body` to mark main content:

```vento
<article data-pagefind-body>
  <h1>{{ title }}</h1>
  <p>{{ content }}</p>
</article>
```

### Exclude Content from Search

Use `data-pagefind-ignore` to exclude sections:

```vento
<div data-pagefind-ignore>
  <p>This content won't be indexed</p>
</div>
```

Or exclude specific elements:

```vento
<article>
  <h1>{{ title }}</h1>
  <aside data-pagefind-ignore>
    <p>Sidebar content - not searchable</p>
  </aside>
  <div>
    <p>Main content - searchable</p>
  </div>
</article>
```

### Add Metadata for Better Results

```vento
<article
  data-pagefind-body
  data-pagefind-meta="title:{{ title }}, author:{{ author }}, date:{{ date }}"
>
  <h1>{{ title }}</h1>
  <p>{{ content }}</p>
</article>
```

### Filter by Categories

```vento
<article
  data-pagefind-body
  data-pagefind-filter="category:{{ category }}, tag:{{ tag }}"
>
  <h1>{{ title }}</h1>
  <p>{{ content }}</p>
</article>
```

## Custom Search UI

### Using Pagefind Directly

For more control, use the Pagefind JavaScript API:

```html
<input type="search" id="search-input" placeholder="Search...">
<div id="search-results"></div>

<script type="module">
  import * as pagefind from "/_pagefind/pagefind.js"

  await pagefind.init()

  const searchInput = document.getElementById('search-input')
  const resultsDiv = document.getElementById('search-results')

  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value

    if (query.length < 2) {
      resultsDiv.innerHTML = ''
      return
    }

    const search = await pagefind.search(query)

    const results = await Promise.all(
      search.results.map(r => r.data())
    )

    resultsDiv.innerHTML = results.map(result => `
      <div class="search-result">
        <h3>
          <a href="${result.url}">${result.meta.title}</a>
        </h3>
        <p>${result.excerpt}</p>
      </div>
    `).join('')
  })
</script>
```

### Custom Styling

Override Pagefind UI styles:

```css
.pagefind-ui {
  --pagefind-ui-primary: #034ad8;
  --pagefind-ui-text: #393939;
  --pagefind-ui-background: #ffffff;
  --pagefind-ui-border: #eeeeee;
  --pagefind-ui-tag: #eeeeee;
  --pagefind-ui-border-width: 2px;
  --pagefind-ui-border-radius: 8px;
  --pagefind-ui-image-border-radius: 8px;
  --pagefind-ui-image-box-ratio: 3 / 2;
  --pagefind-ui-font: sans-serif;
}

.pagefind-ui__search-input {
  padding: 12px 16px;
  font-size: 16px;
}

.pagefind-ui__result {
  padding: 16px;
  border: 1px solid var(--pagefind-ui-border);
  border-radius: 8px;
  margin-bottom: 12px;
}

.pagefind-ui__result-link {
  font-weight: 600;
  color: var(--pagefind-ui-primary);
}
```

## Performance Optimization

### Index Only Main Content

```ts
vitto({
  pagefindOptions: {
    rootSelector: 'main', // Only index main content
    excludeSelectors: ['nav', 'footer', 'aside', '.sidebar']
  }
})
```

### Reduce Index Size

```vento
<article data-pagefind-body>
  {{# Only essential content is indexed #}}
  <h1>{{ title }}</h1>
  <div class="content">{{ content |> safe }}</div>

  {{# Exclude metadata, comments, etc. #}}
  <div data-pagefind-ignore>
    <div class="metadata">{{ date }} by {{ author }}</div>
    <div class="comments">...</div>
  </div>
</article>
```

### Lazy Load Search

Load Pagefind only when needed:

```html
<button id="open-search">Search</button>
<div id="search-modal" style="display: none;">
  <div id="search"></div>
</div>

<script>
  let searchLoaded = false

  document.getElementById('open-search').addEventListener('click', async () => {
    const modal = document.getElementById('search-modal')
    modal.style.display = 'block'

    if (!searchLoaded) {
      // Lazy load Pagefind UI
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/_pagefind/pagefind-ui.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = '/_pagefind/pagefind-ui.js'
      script.onload = () => {
        new PagefindUI({ element: "#search" })
      }
      document.body.appendChild(script)

      searchLoaded = true
    }
  })
</script>
```

## Advanced Features

### Multi-language Support

```ts
vitto({
  pagefindOptions: {
    forceLanguage: 'en' // or auto-detect
  }
})
```

Mark content with language:

```vento
<article data-pagefind-body lang="en">
  <h1>English Content</h1>
</article>

<article data-pagefind-body lang="es">
  <h1>Contenido en Español</h1>
</article>
```

### Weighted Results

Boost certain content in search results:

```vento
<article data-pagefind-body>
  <h1 data-pagefind-weight="10">{{ title }}</h1>
  <p data-pagefind-weight="5">{{ excerpt }}</p>
  <div>{{ content |> safe }}</div>
</article>
```

### Custom Sorting

```vento
<article
  data-pagefind-body
  data-pagefind-sort="date:{{ date }}, views:{{ views }}"
>
  <h1>{{ title }}</h1>
  <p>{{ content }}</p>
</article>
```

Then in your search UI:

```javascript
const search = await pagefind.search(query, {
  sort: { date: "desc" }
})
```

## Development vs Production

### Development Mode

Search indexing is skipped in development mode for faster builds. To test search locally:

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

### Production Mode

Search index is automatically generated during production builds:

```bash
npm run build
```

The index files are created in `dist/_pagefind/`.

## Troubleshooting

### Search Not Working

1. **Check if indexing is enabled**:
   ```ts
   vitto({ enableSearchIndex: true })
   ```

2. **Verify production build**:
   Search only works in production builds, not in dev mode.

3. **Check browser console** for errors loading Pagefind files.

4. **Verify files exist**:
   ```
   dist/
   └── _pagefind/
       ├── pagefind.js
       ├── pagefind-ui.js
       └── pagefind-ui.css
   ```

### No Results Found

1. **Check `data-pagefind-body`** is present on content elements
2. **Verify content isn't marked** with `data-pagefind-ignore`
3. **Check `rootSelector`** matches your content structure
4. **Review `excludeSelectors`** aren't too broad

### Slow Indexing

1. **Reduce indexed content** using `rootSelector`
2. **Exclude unnecessary elements** with `excludeSelectors`
3. **Use `data-pagefind-ignore`** on large non-content sections

### Large Index Size

1. Index only essential content
2. Exclude images and media from indexing
3. Use `data-pagefind-ignore` on repetitive content
4. Consider pagination for large sites

## Best Practices

### 1. Mark Main Content Explicitly

```vento
<main data-pagefind-body>
  {{ content |> safe }}
</main>
```

### 2. Exclude Navigation and Footers

```vento
<nav data-pagefind-ignore>...</nav>
<footer data-pagefind-ignore>...</footer>
```

### 3. Add Meaningful Metadata

```vento
<article
  data-pagefind-meta="title:{{ title }}, category:{{ category }}"
>
```

### 4. Optimize for Mobile

```css
@media (max-width: 768px) {
  .pagefind-ui__search-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
```

### 5. Provide Search Feedback

```html
<div id="search-status" aria-live="polite"></div>

<script>
  searchInput.addEventListener('input', async (e) => {
    const status = document.getElementById('search-status')
    status.textContent = 'Searching...'

    const results = await pagefind.search(e.target.value)
    status.textContent = `Found ${results.results.length} results`
  })
</script>
```

## Examples

### Complete Search Component

`src/partials/search.vto`:

```vento
<div class="search-wrapper">
  <button id="search-toggle" aria-label="Open search">
    🔍 Search
  </button>

  <div id="search-modal" class="search-modal" style="display: none;">
    <div class="search-modal-content">
      <button id="search-close" aria-label="Close search">×</button>
      <div id="search"></div>
    </div>
  </div>
</div>

<style>
  .search-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: auto;
  }

  #search-close {
    float: right;
    font-size: 2rem;
    border: none;
    background: none;
    cursor: pointer;
  }
</style>

<script>
  const toggle = document.getElementById('search-toggle')
  const modal = document.getElementById('search-modal')
  const close = document.getElementById('search-close')
  let searchLoaded = false

  function openSearch() {
    modal.style.display = 'flex'

    if (!searchLoaded) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/_pagefind/pagefind-ui.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = '/_pagefind/pagefind-ui.js'
      script.onload = () => {
        new PagefindUI({
          element: "#search",
          showSubResults: true,
          autofocus: true
        })
      }
      document.body.appendChild(script)

      searchLoaded = true
    }
  }

  function closeSearch() {
    modal.style.display = 'none'
  }

  toggle.addEventListener('click', openSearch)
  close.addEventListener('click', closeSearch)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch()
  })

  // Keyboard shortcut: Ctrl/Cmd + K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
    if (e.key === 'Escape') {
      closeSearch()
    }
  })
</script>
```

## Next Steps

- [Deployment](./08-deployment.md) - Deploy your site with search
- [Performance](./09-performance.md) - Optimize your site
- [Pagefind Documentation](https://pagefind.app/) - Learn more about Pagefind
