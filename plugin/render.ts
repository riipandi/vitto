import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { type Options as MinifyOptions, minify as swcMinify } from '@swc/html'
import { parseQuery } from 'ufo'
import vento, { type Options as VentoOptions } from 'ventojs'
import autoTrim, { defaultTags } from 'ventojs/plugins/auto_trim.js'
import type { Manifest, Plugin, ResolvedConfig } from 'vite'
import { getPageData } from './hooks'
import { _console } from './logger'
import { DEFAULT_OPTS, MINIFY_OPTIONS, type VittoOptions } from './options'

// Global variables to store Vite configuration
let viteRoot = process.cwd()
let viteOutDir = 'dist'

/**
 * Options for rendering a Vento template to HTML.
 */
interface RenderOptions {
  /** Path to the .vto template file */
  filePath: string
  /** Data to be injected into the template context */
  data?: Record<string, unknown>
  /** Whether running in development mode */
  isDev?: boolean
  /** Vite-generated assets (JS and CSS files) */
  assets?: { main: string; css: string[] }
  /** Whether to minify the output HTML */
  minify?: boolean | MinifyOptions
}

/**
 * Render a Vento template file to an HTML string.
 *
 * This function initializes the Vento template engine, processes the template
 * with the provided data context, and optionally minifies the output.
 *
 * @param opts - Render options including file path, data, and minification settings
 * @param ventoOptionsOverride - Optional Vento engine configuration overrides
 * @returns A promise that resolves to the rendered HTML string
 *
 * @example
 * const html = await renderVentoToHtml({
 *   filePath: '/path/to/page.vto',
 *   data: { posts: [...] },
 *   isDev: true,
 *   minify: false
 * })
 */
async function renderVentoToHtml(
  { filePath, data = {}, isDev = false, assets, minify = false }: RenderOptions,
  ventoOptionsOverride?: Partial<VentoOptions>
) {
  // Configure Vento template engine with includes directory
  const ventoOptions: VentoOptions = {
    includes: path.resolve(viteRoot, 'src'),
    ...(ventoOptionsOverride || {}),
  }
  const vnt = vento(ventoOptions)
  vnt.use(autoTrim({ tags: [...defaultTags] }))

  // Calculate relative path from includes directory
  const includesDir = typeof ventoOptions.includes === 'string' ? ventoOptions.includes : ''
  const relPath = path.relative(includesDir, filePath)
  const viteAssets = assets ?? { main: '', css: [] }
  const context = { ...data, isDev, viteAssets }

  // Execute the template with the context
  const result = await vnt.run(relPath, context)
  const htmlContent = result?.content || ''

  // Determine if and how to minify the HTML output
  let shouldMinify = false
  let minifyOpts = MINIFY_OPTIONS
  if (typeof minify === 'object' && minify !== null) {
    shouldMinify = true
    minifyOpts = { ...MINIFY_OPTIONS, ...minify }
  } else if (minify === true) {
    shouldMinify = true
    minifyOpts = MINIFY_OPTIONS
  }

  // Apply minification if enabled
  if (shouldMinify) {
    const minifiedHtml = await swcMinify(htmlContent, minifyOpts)
    return minifiedHtml.code
  }

  return htmlContent
}

/**
 * Extract Vite-generated assets from the build manifest.
 *
 * This function reads the Vite manifest file to find the main JavaScript
 * entry point and associated CSS files for injection into templates.
 *
 * @returns An object containing the main JS file path and array of CSS file paths
 *
 * @example
 * const assets = getViteAssets()
 * // Returns: { main: 'assets/index-abc123.js', css: ['assets/index-abc123.css'] }
 */
function getViteAssets(): { main: string; css: string[] } {
  const manifestPath = path.resolve(viteRoot, viteOutDir, '.vite/manifest.json')
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8')
      const manifest: Manifest = JSON.parse(raw)

      // Try to find index.html entry first
      let main = manifest['index.html']?.file || ''
      let css = manifest['index.html']?.css || []

      // Fallback to first JS/TS entry if index.html not found
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

/**
 * Find all .vto template files in the pages directory.
 *
 * @param pagesDir - Absolute path to the pages directory
 * @returns A promise that resolves to an array of absolute file paths
 *
 * @example
 * const files = await findVtoFiles('/path/to/src/pages')
 * // Returns: ['/path/to/src/pages/index.vto', '/path/to/src/pages/blog.vto']
 */
async function findVtoFiles(pagesDir: string): Promise<string[]> {
  const files: string[] = []
  for await (const file of glob('**/*.vto', { cwd: pagesDir })) {
    files.push(path.resolve(pagesDir, file))
  }
  return files
}

/**
 * Vitto Vite plugin for rendering Vento templates.
 *
 * This plugin integrates Vento templating with Vite, providing:
 * - Development server with hot reload for .vto files
 * - Build-time rendering of templates to static HTML
 * - Dynamic data injection via hooks
 * - Asset management and injection
 *
 * @param opts - Plugin configuration options
 * @returns A Vite plugin object
 *
 * @example
 * // vite.config.ts
 * import vitto from './plugin'
 *
 * export default defineConfig({
 *   plugins: [vitto({
 *     pagesDir: 'src/pages',
 *     minify: true
 *   })]
 * })
 */
export function vitto(opts: VittoOptions = DEFAULT_OPTS): Plugin {
  return {
    name: 'vitto',

    /**
     * Modify Vite configuration to prevent conflicts with rolldown input.
     */
    config(config) {
      if (config.build?.rolldownOptions?.input) {
        delete config.build.rolldownOptions.input
      }
    },

    /**
     * Store resolved Vite configuration for later use.
     */
    configResolved(config: ResolvedConfig) {
      viteRoot = config.root
      viteOutDir = config.build.outDir || 'dist'
    },

    /**
     * Log plugin initialization when build starts.
     */
    buildStart() {
      _console.log('Vitto build started, options:', opts)
    },

    /**
     * Render all .vto templates to HTML files after bundle is closed.
     * This ensures all Vite assets are ready before rendering.
     */
    async closeBundle() {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = await findVtoFiles(pagesDir)
      const viteAssets = opts.assets ?? getViteAssets()
      _console.debug('Detected Vite assets:', viteAssets)

      // Render each template file to HTML
      for (const filePath of files) {
        const data = await getPageData(filePath, opts)
        const html = await renderVentoToHtml(
          {
            filePath,
            data,
            isDev: false,
            assets: viteAssets,
            minify: opts.minify ?? false,
          },
          opts.ventoOptions
        )

        // Calculate output path and write HTML file
        const relPath = path.relative(pagesDir, filePath)
        const outName = relPath.replace(/\.vto$/, '.html')
        const outPath = path.resolve(viteRoot, viteOutDir, outName)
        fs.mkdirSync(path.dirname(outPath), { recursive: true })
        fs.writeFileSync(outPath, html, 'utf-8')
      }
      _console.log('Vitto build finished!')
    },

    /**
     * Emit rendered HTML files as Vite assets during bundle generation.
     * This is an alternative to closeBundle for better Vite integration.
     */
    async generateBundle(_, _bundle) {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = await findVtoFiles(pagesDir)
      const viteAssets = opts.assets ?? getViteAssets()
      _console.debug('Detected Vite assets:', viteAssets)

      // Emit each rendered template as a Vite asset
      for (const filePath of files) {
        const data = await getPageData(filePath, opts)
        const html = await renderVentoToHtml(
          {
            filePath,
            data,
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
     * Configure development server to handle .vto template requests.
     *
     * This middleware:
     * - Intercepts GET requests for HTML pages
     * - Matches URLs to .vto template files
     * - Parses query parameters for dynamic data
     * - Renders templates with hot reload support
     * - Handles 404 errors with custom 404.vto page
     */
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle GET requests
        if (req.method !== 'GET') return next()

        // Parse URL and query string
        const [pathname, search = ''] = req.url?.split('?') ?? ['/']
        const url = pathname || '/'

        // Skip requests for static assets and Vite internal paths
        if (
          /\.[a-zA-Z0-9]+$/.test(url) ||
          url.startsWith('/@vite/') ||
          url.startsWith('/@id/') ||
          url.startsWith('/node_modules/') ||
          url.startsWith('/assets/')
        ) {
          return next()
        }

        // Map URL to .vto template file path
        const pageUrl = url === '/' ? '/index' : url
        const pagesDir = path.resolve(
          viteRoot,
          opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages'
        )
        let vtoPath = path.resolve(`${pagesDir + pageUrl}.vto`)
        if (!fs.existsSync(vtoPath)) {
          vtoPath = path.resolve(`${pagesDir + pageUrl}/index.vto`)
        }

        // Render the template if it exists
        if (fs.existsSync(vtoPath)) {
          // Parse query parameters from URL
          const query = parseQuery(`?${search}`)

          // Fetch dynamic data via hooks (passing query params)
          const data = await getPageData(vtoPath, opts, query)

          // Render template to HTML
          const html = await renderVentoToHtml(
            {
              filePath: vtoPath,
              data,
              isDev: true,
              assets: opts.assets ?? undefined,
              minify: opts.minify ?? false,
            },
            opts.ventoOptions
          )

          // Send HTML response
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }

        // Handle 404 with custom 404.vto page if it exists
        const notFoundPath = path.resolve(pagesDir, '404.vto')
        if (fs.existsSync(notFoundPath)) {
          const data = await getPageData(notFoundPath, opts)
          const html = await renderVentoToHtml(
            {
              filePath: notFoundPath,
              data,
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

        next() // Pass to next middleware if no template found
      })

      // Watch for file changes in src directory
      server.watcher.add([
        path.resolve(viteRoot, 'src/**/*.vto'),
        path.resolve(viteRoot, 'src/**/*.ts'),
        path.resolve(viteRoot, 'src/**/*.js'),
        path.resolve(viteRoot, 'src/**/*.css'),
        path.resolve(viteRoot, 'src/**/*.json'),
      ])

      // Trigger full page reload on file changes
      server.watcher.on('change', (file) => {
        if (file.endsWith('.vto') || file.startsWith(path.resolve(viteRoot, 'src/'))) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}
