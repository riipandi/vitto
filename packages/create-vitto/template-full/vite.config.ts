import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import vitto from 'vitto';

import docsHook from './src/hooks/docs';
import postsHook from './src/hooks/posts';
import type { BlogPost } from './types/blog';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    vitto({
      minify: isProduction,
      enableSearchIndex: true,
      outputStrategy: 'html',
      metadata: {
        siteName: 'My Site',
        title: 'My Site - Full Starter',
        description: 'A full-featured Vitto template with documentation and blog support.',
        keywords: ['vitto', 'ssg', 'vite', 'vento', 'docs', 'blog', 'tailwindcss'],
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
          getParams: (post: BlogPost) => ({ slug: post.slug }),
          getPath: (post: BlogPost) => `blog/${post.slug}.html`,
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
  build: {
    minify: isProduction,
    chunkSizeWarningLimit: 1024 * 4,
    reportCompressedSize: false,
    emptyOutDir: true,
    manifest: true,
  },
});
