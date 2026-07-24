import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import vitto from 'vitto';

import docsHook from './hooks/docs';
import postsHook from './hooks/posts';

export default defineConfig({
  plugins: [
    vitto({
      minify: process.env.NODE_ENV === 'production',
      enableSearchIndex: true,
      outputStrategy: 'html',
      metadata: {
        siteName: 'My Docs',
        title: 'My Docs - Documentation Site',
        description: `A documentation site built with Vitto, Vite, and Tailwind CSS.`,
        keywords: ['docs', 'documentation', 'vitto', 'vite', 'tailwindcss', 'ssg'],
        author: 'Your Name',
      },
      hooks: {
        docs: docsHook,
        doc: docsHook,
        posts: postsHook,
        post: postsHook,
      },
      dynamicRoutes: [
        {
          template: 'doc',
          dataSource: 'docs',
          getParams: (doc: any) => ({ slug: doc.slug }),
          getPath: (doc: any) => `docs/${doc.slug}.html`,
        },
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post: any) => ({ slug: post.slug }),
          getPath: (post: any) => `blog/${post.slug}.html`,
        },
        {
          template: 'blog',
          dataSource: 'posts',
          pageSize: 10,
          getParams: (pageNum: number) => ({ _page: pageNum }),
          getPath: (pageNum: number) => (pageNum === 1 ? 'blog.html' : `blog/${pageNum}.html`),
        },
      ],
    }),
    tailwindcss(),
  ],
});
