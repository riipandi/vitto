import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  minify: process.env.NODE_ENV === 'production',
  ignoreWatch: ['.turbo'],
  target: 'node20',
})
