# Examples

Real-world usage patterns for common site features.

## Blog with Dynamic Routes

Combine data hooks with dynamic routes to generate blog pages from markdown files.

::::tabs
@tab:active Hook

```ts
import { defineHooks } from 'vitto';
import fs from 'node:fs';
import path from 'node:path';

export default defineHooks('posts', async () => {
  const dir = path.join(process.cwd(), 'content/blog');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((file) => ({
    slug: file.replace(/^\d+-/, '').replace('.md', ''),
    title: file.replace(/^\d+-/, '').replace('.md', '').replace(/-/g, ' '),
  }));
});
```

@tab Template

```vento
{{ layout "layouts/site.vto" }}
{{ for post of posts }}
  <article>
    <h2><a href="/blog/{{ post.slug }}">{{ post.title }}</a></h2>
  </article>
{{ /for }}
```

@tab Config

```ts
dynamicRoutes: [
  {
    template: 'post',
    dataSource: 'posts',
    getParams: (post) => ({ slug: post.slug }),
    getPath: (post) => `blog/${post.slug}.html`,
  },
],
```

::::

## Multi-language Content

Use tabs to present the same content in different languages:

::::tabs
@tab:active EN
Hello — this is the English version.
@tab ES
Hola — esta es la versión en español.
@tab FR
Bonjour — voici la version française.
::::

## Using Alerts in Context

> [!IMPORTANT]
> Combine alerts with other elements for rich documentation.

> [!TIP]
> Alerts support markdown inside them: **bold**, `code`, and [links](/docs).

## Task List as Roadmap

- [x] Research and planning
- [x] Core features implemented
- [ ] Beta testing
- [ ] Public launch
- [ ] Post-launch optimization

## Table with Comparison

| Feature          | Basic | Standard | Premium   |
| ---------------- | ----- | -------- | --------- |
| Pages            | 10    | 50       | Unlimited |
| Search           | —     | ✅       | ✅        |
| Multi-language   | —     | —        | ✅        |
| Priority support | —     | —        | ✅        |
