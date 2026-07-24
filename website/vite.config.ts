import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import vitto from 'vitto';

import changelogsHook from './src/hooks/changelogs';
import docsHook from './src/hooks/docs';
import postsHook from './src/hooks/posts';
import type { BlogPost } from './types/blog';
import type { ChangelogEntry } from './types/changelog';

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
        description:
          'A minimal static site generator built with Vite and the Vento templating engine. Fast, flexible, and zero-config.',
        keywords: ['vento', 'ssg', 'vite', 'plugin', 'generator', 'static', 'website', 'jamstack'],
        author: 'Aris Ripandi',
        social: {
          github: 'https://github.com/riipandi/vitto',
          x: 'https://x.com/intent/follow?screen_name=riipandi',
        },
      },
      hooks: {
        docs: docsHook,
        doc: docsHook,
        changelogs: changelogsHook,
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
        {
          template: 'changelog',
          dataSource: 'changelogs',
          getParams: () => ({}),
          getPath: () => 'changelog.html',
        },
        {
          template: 'release',
          dataSource: 'changelogs',
          getParams: (entry: ChangelogEntry) => ({ slug: entry.slug }),
          getPath: (entry: ChangelogEntry) => `changelog/${entry.slug}.html`,
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
