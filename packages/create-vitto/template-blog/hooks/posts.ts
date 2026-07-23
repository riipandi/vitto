import { defineHooks } from 'vitto';

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export default defineHooks<Post[]>('posts', async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts = await res.json();
  return posts;
});
