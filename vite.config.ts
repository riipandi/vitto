import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
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
