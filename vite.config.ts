import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import postHook from './hooks/post'
import postsHook from './hooks/posts'
import vitto from './plugin'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    vitto({
      minify: !isProduction,
      hooks: {
        blog: postsHook, // For blog.vto - list of posts
        post: postHook, // For post.vto - single post detail
        posts: postsHook, // For static generation data source
      },
      dynamicRoutes: [
        {
          template: 'post', // Use post.vto template
          dataSource: 'posts', // Get data from posts hook
          getParams: (post) => ({ id: post.id, slug: post.id }),
          getPath: (post) => `blog/${post.id}.html`, // Output path
        },
      ],
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: { port: 3000, strictPort: false, cors: { origin: '*' } },
  preview: { port: 3000, strictPort: false },
  build: {
    manifest: true,
    emptyOutDir: true,
    minify: isProduction,
    chunkSizeWarningLimit: 1024 * 4,
    reportCompressedSize: false,
    rolldownOptions: {
      input: resolve('src/main.ts'),
    },
  },
})
