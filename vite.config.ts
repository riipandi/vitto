import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import vitto from './plugin'

export default defineConfig({
  plugins: [tailwindcss(), vitto(), tsconfigPaths()],
  server: { port: 3000, strictPort: true, cors: { origin: '*' } },
  preview: { port: 3000, strictPort: true },
  build: {
    manifest: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1024 * 4,
    minify: process.env.NODE_ENV === 'production',
    reportCompressedSize: false,
    rolldownOptions: {
      input: resolve('src/main.ts'),
    },
  },
})
