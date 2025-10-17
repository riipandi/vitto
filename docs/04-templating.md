# Templating Guide

Vitto uses [Vento](https://vento.js.org) as its templating engine. This guide covers the basics and Vitto-specific features.

## Template Syntax

Vento uses a simple and intuitive syntax:

### Variables

```vento
{{ variableName }}
```

### Expressions

```vento
{{ 1 + 2 }}
{{ user.name }}
{{ items.length }}
```

### Filters (Pipes)

```vento
{{ title |> uppercase }}
{{ content |> safe }}
{{ date |> dateFormat("YYYY-MM-DD") }}
```

### Comments

```vento
{{# This is a comment #}}
```

## Layouts

Layouts wrap your page content. The page content is available as the `content` variable.

### Creating a Layout

`src/layouts/base.vto`:

```vento
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">
  {{ renderAssets() |> safe }}
</head>
<body>
  {{ include "partials/header.vto" }}

  <main>
    {{ content |> safe }}
  </main>

  {{ include "partials/footer.vto" }}
</body>
</html>
```

### Nested Layouts

You can nest layouts:

`src/layouts/article.vto`:

```vento
{{ set pageTitle = "Homepage" }}
{{ layout "layouts/base.vto" }}

<article>
  <header>
    <h1>{{ title }}</h1>
    <time datetime="{{ date }}">{{ date |> dateFormat }}</time>
  </header>

  {{ content |> safe }}
</article>
```

## Partials

Partials are reusable template components.

### Creating a Partial

`src/partials/header.vto`:

```vento
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about.html">About</a>
    <a href="/blog.html">Blog</a>
  </nav>
</header>
```

### Including Partials

```vento
{{ include "partials/header.vto" }}
```

### Passing Data to Partials

```vento
{{ include "partials/card.vto" { title: "Hello", content: "World" } }}
```

`src/partials/card.vto`:

```vento
<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ content }}</p>
</div>
```

## Vitto-Specific Features

### `renderAssets()` Function

Injects Vite-generated CSS and JavaScript assets into your template:

```vento
<head>
  {{ renderAssets() |> safe }}
</head>
```

This automatically generates:

```html
<!-- In development -->
<script type="module" src="/@vite/client"></script>
<script type="module" src="/src/main.js"></script>

<!-- In production -->
<link rel="stylesheet" href="/assets/style-abc123.css">
<script type="module" src="/assets/main-def456.js"></script>
```

### `viteAssets` Object

Access individual assets manually:

```vento
{{# JavaScript #}}
<script type="module" src="{{ viteAssets.main }}"></script>

{{# CSS #}}
{{ for css of viteAssets.css }}
  <link rel="stylesheet" href="{{ css }}">
{{ /for }}
```

### Dynamic Data from Hooks

Data from hooks is automatically available in templates:

```vento
{{# Assuming you have a 'posts' hook #}}
{{ for post of posts }}
  <article>
    <h2>{{ post.title }}</h2>
    <p>{{ post.excerpt }}</p>
  </article>
{{ /for }}
```

See [Hooks System](./06-hooks.md) for more details.

## Control Flow

### Conditionals

```vento
{{ if user }}
  <p>Welcome, {{ user.name }}!</p>
{{ else }}
  <p>Please log in.</p>
{{ /if }}
```

```vento
{{ if items.length > 0 }}
  <ul>
    {{ for item of items }}
      <li>{{ item }}</li>
    {{ /for }}
  </ul>
{{ else }}
  <p>No items found.</p>
{{ /if }}
```

### Loops

**For...of loop:**

```vento
{{ for post of posts }}
  <h2>{{ post.title }}</h2>
{{ /for }}
```

**For...in loop:**

```vento
{{ for key, value in object }}
  <p>{{ key }}: {{ value }}</p>
{{ /for }}
```

**With index:**

```vento
{{ for post, index of posts }}
  <p>{{ index + 1 }}. {{ post.title }}</p>
{{ /for }}
```

## Filters

Vento includes built-in filters. Use the `safe` filter to render HTML:

```vento
{{ htmlContent |> safe }}
```

**Common filters:**

```vento
{{ text |> uppercase }}
{{ text |> lowercase }}
{{ text |> trim }}
{{ array |> join(", ") }}
{{ number |> fixed(2) }}
```

### Custom Filters

You can add custom filters via `ventoOptions`:

```ts
// vite.config.ts
vitto({
  ventoOptions: {
    filters: {
      dateFormat: (date: Date, format: string) => {
        // Your date formatting logic
        return formattedDate
      }
    }
  }
})
```

Use in templates:

```vento
{{ date |> dateFormat("YYYY-MM-DD") }}
```

## Best Practices

### 1. Always Use `safe` Filter for HTML Content

```vento
{{ content |> safe }}
{{ renderAssets() |> safe }}
```

### 2. Escape User-Generated Content

By default, Vento escapes output. Only use `safe` for trusted content:

```vento
{{# Auto-escaped (safe from XSS) #}}
{{ userComment }}

{{# NOT safe - only use for trusted content #}}
{{ userComment |> safe }}
```

### 3. Keep Layouts Simple

Layouts should focus on structure. Move complex logic to hooks or partials.

### 4. Use Descriptive Variable Names

```vento
{{# Good #}}
{{ blogPost.title }}
{{ author.name }}

{{# Avoid #}}
{{ x }}
{{ data }}
```

### 5. Organize Partials by Purpose

```
src/partials/
├── layout/
│   ├── header.vto
│   └── footer.vto
├── components/
│   ├── card.vto
│   └── button.vto
└── seo/
    └── meta-tags.vto
```

## Complete Example

`src/pages/blog.vto`:

```vento
{{ set pageTitle = "Blog" }}
{{ layout "layouts/site.vto" }}

<div class="blog-container">
  <h1>{{ title }}</h1>

  {{ if posts && posts.length > 0 }}
    <div class="posts-grid">
      {{ for post of posts }}
        {{ include "partials/post-card.vto" {
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
          url: `/blog/${post.slug}.html`
        } }}
      {{ /for }}
    </div>
  {{ else }}
    <p>No posts available yet.</p>
  {{ /if }}
</div>
```

`src/partials/post-card.vto`:

```vento
<article class="post-card">
  <h2>
    <a href="{{ url }}">{{ title }}</a>
  </h2>
  <time datetime="{{ date }}">{{ date }}</time>
  <p>{{ excerpt }}</p>
  <a href="{{ url }}" class="read-more">Read more →</a>
</article>
```

## Learn More

- [Vento Documentation](https://vento.js.org) - Official Vento docs
- [Dynamic Routes](./05-dynamic-routes.md) - Generate pages from data
- [Hooks System](./06-hooks.md) - Inject dynamic data

## Next Steps

- [Dynamic Routes](./05-dynamic-routes.md) - Generate multiple pages from data
- [Hooks System](./06-hooks.md) - Fetch and inject dynamic data
- [Search Integration](./07-search.md) - Add search to your site
