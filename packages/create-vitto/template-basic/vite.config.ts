import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  plugins: [
    vitto({
      minify: process.env.NODE_ENV === 'production',
      enableSearchIndex: true,
      outputStrategy: 'html',
      metadata: {
        siteName: 'Vitto',
        title: 'Vitto - Static Site Generator Powered by Vite & Vento',
        description: `A minimal static site generator built with Vite and the Vento templating engine.`,
        keywords: ['vento', 'ssg', 'vite', 'plugin', 'generator', 'static', 'website', 'jamstack'],
        author: 'John Doe',
      }
    })
  ],
  server: {
    port: 3000,
    strictPort: false,
    cors: { origin: '*' }
  },
  preview: { port: 3000, strictPort: false },
  clearScreen: false,
  build: {
    rollupOptions: {
      input: resolve('src/main.ts'),
    },
  },
})
