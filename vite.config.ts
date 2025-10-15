import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import ventoPlugin from './plugin'

export default defineConfig({
  plugins: [tailwindcss(), ventoPlugin(), tsconfigPaths()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: {
    manifest: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1024 * 4,
    minify: process.env.NODE_ENV === 'production',
    reportCompressedSize: false,
  },
})
