import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import vitto from './plugin'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [tailwindcss(), vitto({ minify: isProduction }), tsconfigPaths()],
  server: { port: 3000, strictPort: true, cors: { origin: '*' } },
  preview: { port: 3000, strictPort: true },
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
