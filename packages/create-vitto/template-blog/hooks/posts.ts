import { defineHooks } from 'vitto';

export default defineHooks('posts', async (params) => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts = await res.json();

  if (params?.id) {
    return posts.find((p: any) => p.id === Number(params.id)) || null;
  }

  return posts;
});
