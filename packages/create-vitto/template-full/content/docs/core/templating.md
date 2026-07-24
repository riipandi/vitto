# Templating

Vento is the templating engine. It compiles to HTML at build time — no client-side rendering.

> [!NOTE]
> Vento templates use `{{ }}` syntax. Layouts, partials, and data injection are all built-in.

## Layouts

Wrap pages in a layout using the `layout` tag:

::::tabs
@tab:active Page template

```vento
{{ layout "layouts/site.vto" }}
<h1>{{ title }}</h1>
<p>{{ description }}</p>
```

@tab Layout template

```vento
<!DOCTYPE html>
<html>
<head>
  <title>{{ pageTitle }}</title>
</head>
<body>
  {{ content |> safe }}
</body>
</html>
```

::::

## Partials

Reusable components included with `include`:

```vento
{{ include "partials/header.vto" }}
{{ include "partials/footer.vto" }}
```

Partials live in `src/partials/` and have access to the same data as the page.

## Data Injection

Data hooks inject content from any source — markdown files, APIs, or databases:

```ts
import { defineHooks } from 'vitto';

export default defineHooks('posts', async () => {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
});
```

Access hook data in templates by name:

```vento
{{ for post of posts }}
  <article>
    <h2>{{ post.title }}</h2>
    <p>{{ post.excerpt }}</p>
  </article>
{{ /for }}
```

> [!TIP]
> Hooks are async JavaScript functions. They run at build time and the result is available as a template variable.

## Syntax Reference

| Tag             | Purpose       | Example                               |
| --------------- | ------------- | ------------------------------------- |
| `{{ var }}`     | Output        | `{{ title }}`                         |
| `{{ if }}`      | Condition     | `{{ if show }}...{{ /if }}`           |
| `{{ for }}`     | Loop          | `{{ for item of list }}...{{ /for }}` |
| `{{ include }}` | Partial       | `{{ include "header.vto" }}`          |
| `{{ layout }}`  | Layout        | `{{ layout "base.vto" }}`             |
| `\|> safe`      | Unescape HTML | `{{ content \|> safe }}`              |

> [!CAUTION]
> Always use `|> safe` when rendering HTML content. Without it, HTML is escaped and displayed as text.
