import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import vitto from 'vitto'
import postsHook from './hooks/posts'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    vitto({
      minify: isProduction,
      enableSearchIndex: true,
      outputStrategy: 'html',
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
    tsconfigPaths(),
  ],
  server: { port: 3000, strictPort: false, cors: { origin: '*' } },
  preview: { port: 3000, strictPort: false },
  clearScreen: false,
  build: {
    manifest: true,
    emptyOutDir: true,
    minify: isProduction,
    chunkSizeWarningLimit: 1024 * 4,
    reportCompressedSize: false,
    rollupOptions: {
      input: resolve('src/main.ts'),
    },
  },
})
