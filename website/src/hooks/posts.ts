import { defineHooks } from 'vitto';

export default defineHooks('posts', async (params) => {
  // If id or slug is provided, fetch single post
  if (params?.id || params?.slug) {
    const postId = params.id || params.slug;
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);

    if (!res.ok) {
      return null;
    }

    return res.json();
  }

  // Otherwise, fetch list of all posts
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  const data = await res.json();

  return data;
});
