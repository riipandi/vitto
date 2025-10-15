import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { type Options as MinifyOptions, minify as swcMinify } from '@swc/html'
import vento, { type Options as VentoOptions } from 'ventojs'
import autoTrim, { defaultTags } from 'ventojs/plugins/auto_trim.js'
import type { Manifest, Plugin, ResolvedConfig } from 'vite'
import { _console } from './logger'
import { DEFAULT_OPTS, MINIFY_OPTIONS, type VittoOptions } from './options'

// Store Vite root and output directory, updated after config is resolved
let viteRoot = process.cwd()
let viteOutDir = 'dist'

interface RenderOptions {
  filePath: string
  data?: Record<string, unknown>
  isDev?: boolean
  assets?: { main: string; css: string[] }
  minify?: boolean | MinifyOptions
}

/**
 * Render a Vento template file to HTML string.
 * @param opts - Render options
 */
async function renderVentoToHtml(
  { filePath, data = {}, isDev = false, assets, minify = false }: RenderOptions,
  ventoOptionsOverride?: Partial<VentoOptions>
) {
  const ventoOptions: VentoOptions = {
    includes: path.resolve(viteRoot, 'src'),
    ...(ventoOptionsOverride || {}),
  }
  const vnt = vento(ventoOptions)

  // Use autoTrim plugin to to trim the whitespace from around tags.
  // @see: https://vento.js.org/plugins/auto-trim/
  vnt.use(autoTrim({ tags: [...defaultTags] }))

  const includesDir = typeof ventoOptions.includes === 'string' ? ventoOptions.includes : ''
  const relPath = path.relative(includesDir, filePath)
  const viteAssets = assets ?? { main: '', css: [] }
  const context = { ...data, isDev, viteAssets }

  const result = await vnt.run(relPath, context)
  const htmlContent = result?.content || ''

  // Determine minify options
  let shouldMinify = false
  let minifyOpts = MINIFY_OPTIONS
  if (typeof minify === 'object' && minify !== null) {
    shouldMinify = true
    minifyOpts = { ...MINIFY_OPTIONS, ...minify }
  } else if (minify === true) {
    shouldMinify = true
    minifyOpts = MINIFY_OPTIONS
  }

  if (shouldMinify) {
    const minifiedHtml = await swcMinify(htmlContent, minifyOpts)
    return minifiedHtml.code
  }

  return htmlContent
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
      // Fallback: find the first JS/TS entry if 'index.html' is missing
      if (!main) {
        const first = Object.values(manifest).find(
          (entry) =>
            typeof entry === 'object' &&
            entry.file &&
            (entry.file.endsWith('.js') || entry.file.endsWith('.ts'))
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

async function findVtoFiles(pagesDir: string): Promise<string[]> {
  const files: string[] = []
  for await (const file of glob('**/*.vto', { cwd: pagesDir })) {
    files.push(path.resolve(pagesDir, file))
  }
  return files
}

/**
 * Vite plugin for Vento template engine integration.
 */
export default function vitto(opts: VittoOptions = DEFAULT_OPTS): Plugin {
  return {
    name: 'vitto',

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
    },

    buildStart() {
      _console.log('Vitto build started, options:', opts)
    },

    /**
     * After Vite build is finished, render all .vto pages to HTML files.
     */
    async closeBundle() {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = await findVtoFiles(pagesDir)
      const viteAssets = opts.assets ?? getViteAssets()
      _console.debug('Detected Vite assets:', viteAssets)
      for (const filePath of files) {
        renderVentoToHtml(
          {
            filePath,
            data: {},
            isDev: false,
            assets: viteAssets,
            minify: opts.minify ?? false,
          },
          opts.ventoOptions
        ).then((html) => {
          // Output path: preserve nested structure
          const relPath = path.relative(pagesDir, filePath)
          const outName = relPath.replace(/\.vto$/, '.html')
          const outPath = path.resolve(viteRoot, viteOutDir, outName)
          fs.mkdirSync(path.dirname(outPath), { recursive: true })
          fs.writeFileSync(outPath, html, 'utf-8')
        })
      }
      _console.log('Vitto build finished!')
    },

    /**
     * During bundle generation, emit HTML files for each .vto page.
     */
    async generateBundle(_, _bundle) {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = await findVtoFiles(pagesDir)
      const viteAssets = opts.assets ?? getViteAssets()
      _console.debug('Detected Vite assets:', viteAssets)
      for (const filePath of files) {
        const html = await renderVentoToHtml(
          {
            filePath,
            data: {},
            isDev: false,
            assets: viteAssets,
            minify: opts.minify ?? false,
          },
          opts.ventoOptions
        )
        const relPath = path.relative(pagesDir, filePath)
        const outName = relPath.replace(/\.vto$/, '.html')
        this.emitFile({
          type: 'asset',
          fileName: outName,
          source: html,
        })
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

        // Map URL to .vto page (support nested and index fallback)
        const pageUrl = url === '/' ? '/index' : url
        const pagesDir = path.resolve(
          viteRoot,
          opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages'
        )
        let vtoPath = path.resolve(`${pagesDir + pageUrl}.vto`)
        // Fallback: if not found, try .../index.vto
        if (!fs.existsSync(vtoPath)) {
          vtoPath = path.resolve(`${pagesDir + pageUrl}/index.vto`)
        }
        if (fs.existsSync(vtoPath)) {
          const html = await renderVentoToHtml(
            {
              filePath: vtoPath,
              data: {},
              isDev: true,
              assets: opts.assets ?? undefined,
              minify: opts.minify ?? false,
            },
            opts.ventoOptions
          )
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }
        // Fallback to 404.vto if page not found
        const notFoundPath = path.resolve(pagesDir, '404.vto')
        if (fs.existsSync(notFoundPath)) {
          const html = await renderVentoToHtml(
            {
              filePath: notFoundPath,
              data: {},
              isDev: true,
              assets: opts.assets ?? undefined,
              minify: opts.minify ?? false,
            },
            opts.ventoOptions
          )
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
