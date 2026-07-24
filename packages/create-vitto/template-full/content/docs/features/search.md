# Search Integration

Built-in full-text search powered by **Pagefind**. No server, no API keys, no external services.

> [!NOTE]
> Search runs entirely client-side. The index is generated at build time.

## How It Works

1. During `npm run build`, Pagefind scans the output HTML
2. It builds a lightweight search index saved to `dist/_pagefind/`
3. The browser downloads the index and searches locally

## Configuration

| Option                          | Type    | Default | Description                       |
| ------------------------------- | ------- | ------- | --------------------------------- |
| `enableSearchIndex`             | boolean | `true`  | Enable search indexing            |
| `pagefindOptions.rootSelector`  | string  | `html`  | Element to index                  |
| `pagefindOptions.verbose`       | boolean | `false` | Log indexing details              |
| `pagefindOptions.forceLanguage` | string  | —       | Force language (`en`, `es`, etc.) |

Example configuration in `vite.config.ts`:

```ts
vitto({
  enableSearchIndex: true,
  pagefindOptions: {
    rootSelector: 'main',
    excludeSelectors: ['nav', 'footer', '.sidebar'],
  },
});
```

> [!TIP]
> | To test search locally, run `npm run build && npm run preview`. Search doesn't work in dev mode.

## Mark Content as Searchable

Use `data-pagefind-body` on the main content wrapper:

```html
<main data-pagefind-body>{{ content |> safe }}</main>
```

Exclude sections with `data-pagefind-ignore`:

```html
<nav data-pagefind-ignore>
  <!-- navigation — not indexed -->
</nav>
```

> [!WARNING]
> If no results appear, check that your content has `data-pagefind-body` and isn't accidentally excluded by `rootSelector` or `excludeSelectors`.
