import fs from 'node:fs'
import path from 'node:path'
import vento, { type Options as VentoOptions } from 'ventojs'
import type { Manifest, Plugin, ResolvedConfig } from 'vite'
import { _console } from './logger'
import { DEFAULT_OPTS, type VittoOptions } from './options'

// Store Vite root and output directory, updated after config is resolved
let viteRoot = process.cwd()
let viteOutDir = 'dist'

/**
 * Render a Vento template file to HTML string.
 * @param filePath - Path to the .vto file
 * @param data - Data context for the template
 * @param isDev - Whether in development mode
 * @param assets - Vite assets (JS/CSS) to inject
 */
async function renderVentoToHtml(
  filePath: string,
  data: Record<string, unknown> = {},
  isDev = false,
  assets?: { main: string; css: string[] }
) {
  const ventoOptions: VentoOptions = {
    includes: path.resolve(viteRoot, 'src'),
  }
  const vnt = vento(ventoOptions)
  const includesDir = typeof ventoOptions.includes === 'string' ? ventoOptions.includes : ''
  const relPath = path.relative(includesDir, filePath)
  const context = {
    ...data,
    isDev,
    viteAssets: assets,
  }
  const result = await vnt.run(relPath, context)
  return result?.content || ''
}

/**
 * Read and parse the Vite manifest file, returning main JS and CSS assets.
 * Uses type Manifest for type safety.
 */
function getViteAssets(): { main: string; css: string[] } {
  const manifestPath = path.resolve(viteRoot, viteOutDir, '.vite/manifest.json')
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8')
      const manifest: Manifest = JSON.parse(raw)
      // Try to get main entry from 'index.html' key
      let main = manifest['index.html']?.file || ''
      let css = manifest['index.html']?.css || []
      // Fallback: find the first JS entry if 'index.html' is missing
      if (!main) {
        const first = Object.values(manifest).find(
          (entry) => typeof entry === 'object' && entry.file && entry.file.endsWith('.js')
        ) as { file: string; css?: string[] } | undefined
        main = first?.file || ''
        css = first?.css || []
      }
      return { main, css }
    } catch {
      return { main: '', css: [] }
    }
  }
  return { main: '', css: [] }
}

/**
 * Vite plugin for Vento template engine integration.
 */
export default function vitto(opts: VittoOptions = DEFAULT_OPTS): Plugin {
  return {
    name: 'vite-vitto',

    // Remove default HTML input from rolldownOptions if present
    config(config) {
      if (config.build?.rolldownOptions?.input) {
        delete config.build.rolldownOptions.input
      }
    },

    // Update viteRoot and viteOutDir after Vite config is resolved
    configResolved(config: ResolvedConfig) {
      viteRoot = config.root
      viteOutDir = config.build.outDir || 'dist'
      _console.log('Vite config resolved:', config.root, 'outDir:', viteOutDir)
    },

    buildStart() {
      _console.log('Vento plugin options:', opts)
    },

    /**
     * After Vite build is finished, render all .vto pages to HTML files.
     */
    closeBundle() {
      _console.log('Build finished!')
      const pagesDir = path.resolve(viteRoot, DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = fs.readdirSync(pagesDir)
      const viteAssets = getViteAssets()
      _console.log('Detected Vite assets:', viteAssets)
      for (const file of files) {
        if (file.endsWith('.vto')) {
          const filePath = path.join(pagesDir, file)
          renderVentoToHtml(filePath, {}, false, viteAssets).then((html) => {
            // Output as index.html or <name>.html
            const outName =
              file === 'index.vto' ? 'index.html' : `${path.basename(file, '.vto')}.html`
            const outPath = path.resolve(viteRoot, viteOutDir, outName)
            fs.writeFileSync(outPath, html, 'utf-8')
            _console.log(`Generated: ${outName}`)
          })
        }
      }
    },

    /**
     * During bundle generation, emit HTML files for each .vto page.
     */
    async generateBundle(_, _bundle) {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || 'src/pages')
      const files = fs.readdirSync(pagesDir)
      const viteAssets = getViteAssets()
      _console.log('Detected Vite assets:', viteAssets)
      for (const file of files) {
        if (file.endsWith('.vto')) {
          const filePath = path.join(pagesDir, file)
          const html = await renderVentoToHtml(filePath, {}, false, viteAssets)
          const outName =
            file === 'index.vto' ? 'index.html' : `${path.basename(file, '.vto')}.html`
          this.emitFile({
            type: 'asset',
            fileName: outName,
            source: html,
          })
        }
      }
    },

    /**
     * Dev server middleware: serve .vto pages as HTML on request.
     * Also sets up file watching for live reload.
     */
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET') return next()
        const url = req.url?.split('?')[0] || '/'

        // Skip asset and internal Vite requests
        if (
          /\.[a-zA-Z0-9]+$/.test(url) ||
          url.startsWith('/@vite/') ||
          url.startsWith('/@id/') ||
          url.startsWith('/node_modules/') ||
          url.startsWith('/assets/')
        ) {
          return next()
        }

        // Map URL to .vto page
        const pageUrl = url === '/' ? '/index' : url
        const vtoPath = path.resolve(viteRoot, `src/pages${pageUrl}.vto`)
        if (fs.existsSync(vtoPath)) {
          const html = await renderVentoToHtml(vtoPath, {}, true)
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }
        // Fallback to 404.vto if page not found
        const notFoundPath = path.resolve(viteRoot, 'src/pages/404.vto')
        if (fs.existsSync(notFoundPath)) {
          const html = await renderVentoToHtml(notFoundPath, {}, true)
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }
        next()
      })

      // Watch all .vto and src changes for reload
      server.watcher.add([
        path.resolve(viteRoot, 'src/**/*.vto'),
        path.resolve(viteRoot, 'src/**/*.ts'),
        path.resolve(viteRoot, 'src/**/*.js'),
        path.resolve(viteRoot, 'src/**/*.css'),
        path.resolve(viteRoot, 'src/**/*.json'),
      ])

      // Trigger full reload on template or source changes
      server.watcher.on('change', (file) => {
        if (file.endsWith('.vto') || file.startsWith(path.resolve(viteRoot, 'src/'))) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}
