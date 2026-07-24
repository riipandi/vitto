import { defineHooks } from 'vitto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default defineHooks('posts', async (params) => {
  if (params?.id || params?.slug) {
    const cache = (globalThis as any).__vitto_posts_slug_map;
    if (!cache?.length) {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts');
      const data = await res.json();
      (globalThis as any).__vitto_posts_slug_map = buildSlugMap(data);
    }
    const post = (globalThis as any).__vitto_posts_slug_map.find(
      (p: any) => p.slug === (params.id || params.slug)
    );
    if (!post) return null;
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${post.id}`);
    if (!res.ok) return null;
    return res.json();
  }

  const cache = (globalThis as any).__vitto_posts_slug_map;
  if (!cache?.length) {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await res.json();
    (globalThis as any).__vitto_posts_slug_map = buildSlugMap(data);
  }
  return (globalThis as any).__vitto_posts_slug_map;
});

function buildSlugMap(posts: any[]) {
  const baseCounts = new Map<string, number>();
  return posts.map((post) => {
    const base = slugify(post.title);
    const count = baseCounts.get(base) || 0;
    const slug = count === 0 ? base : `${base}-${count}`;
    baseCounts.set(base, count + 1);
    return { ...post, slug };
  });
}
