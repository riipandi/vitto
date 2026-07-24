import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import vitto from 'vitto';

import postsHook from './hooks/posts';

export default defineConfig({
  plugins: [
    vitto({
      minify: process.env.NODE_ENV === 'production',
      enableSearchIndex: true,
      outputStrategy: 'html',
      metadata: {
        siteName: 'Vitto Blog',
        title: 'Vitto Blog - Static Site Generator Powered by Vite & Vento',
        description: `A blog template built with Vite, Vento, and Tailwind CSS featuring pagination.`,
        keywords: [
          'vento',
          'ssg',
          'vite',
          'plugin',
          'generator',
          'static',
          'website',
          'jamstack',
          'blog',
        ],
        author: 'Your Name',
      },
      hooks: {
        posts: postsHook,
        post: postsHook,
      },
      dynamicRoutes: [
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post: any) => ({ slug: post.slug }),
          getPath: (post: any) => `blog/${post.slug}.html`,
        },
        {
          template: 'blog',
          dataSource: 'posts',
          pageSize: 5,
          getParams: (pageNum: number) => ({ _page: pageNum }),
          getPath: (pageNum: number) => (pageNum === 1 ? 'blog.html' : `blog/${pageNum}.html`),
        },
      ],
    }),
    tailwindcss(),
  ],
});
