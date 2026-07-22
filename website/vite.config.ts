import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import vitto from 'vitto';

import postsHook from './src/hooks/posts';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    vitto({
      minify: isProduction,
      enableSearchIndex: true,
      outputStrategy: 'html',
      metadata: {
        siteName: 'Vitto',
        title: 'Vitto - Static Site Generator Powered by Vite & Vento',
        description: `A minimal static site generator built with Vite and the Vento templating engine.`,
        keywords: ['vento', 'ssg', 'vite', 'plugin', 'generator', 'static', 'website', 'jamstack'],
        // Custom metadata fields
        author: 'Aris Ripandi',
        social: {
          github: 'https://github.com/riipandi/vitto',
          x: 'https://x.com/intent/follow?screen_name=riipandi',
        },
      },
      hooks: {
        blog: postsHook, // For blog.vto - list of posts
        posts: postsHook, // Data source for dynamic routes
      },
      dynamicRoutes: [
        {
          template: 'post',
          dataSource: 'posts',
          getParams: (post) => ({ id: post.id }),
          getPath: (post) => `blog/${post.id}.html`,
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
