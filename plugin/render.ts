import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { type Options as MinifyOptions, minify as swcMinify } from '@swc/html'
import { parseQuery } from 'ufo'
import vento, { type Options as VentoOptions } from 'ventojs'
import autoTrim, { defaultTags } from 'ventojs/plugins/auto_trim.js'
import type { Plugin, ResolvedConfig } from 'vite'
import { createDynamicRoutePatterns, getPageData } from './hooks'
import { _console } from './logger'
import { DEFAULT_OPTS, MINIFY_OPTIONS, type VittoOptions } from './options'

// Global variable to store Vite root directory
// This is set in configResolved hook and used throughout the plugin
let viteRoot = process.cwd()

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
 * This function:
 * 1. Initializes the Vento template engine with the provided options
 * 2. Applies auto-trim plugin to remove unnecessary whitespace
 * 3. Injects data and Vite assets into the template context
 * 4. Renders the template to HTML
 * 5. Optionally minifies the output HTML
 *
 * @param options - Rendering options including file path, data, and minification settings
 * @param ventoOptionsOverride - Optional Vento engine configuration overrides
 * @returns The rendered HTML string
 *
 * @example
 * const html = await renderVentoToHtml({
 *   filePath: 'src/pages/index.vto',
 *   data: { title: 'Home' },
 *   isDev: false,
 *   assets: { main: 'main.js', css: ['style.css'] },
 *   minify: true
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

  // Apply auto-trim plugin to remove unnecessary whitespace from templates
  vnt.use(autoTrim({ tags: [...defaultTags] }))

  // Calculate relative path from includes directory to template file
  const includesDir = typeof ventoOptions.includes === 'string' ? ventoOptions.includes : ''
  const relPath = path.relative(includesDir, filePath)

  // Prepare template context with user data and Vite assets
  const viteAssets = assets ?? { main: '', css: [] }

  // Create renderAssets function with closure over isDev and viteAssets
  const renderAssets = () => {
    if (isDev) {
      // In dev mode, add suspense wrapper to prevent FOUC (Flash of Unstyled Content)
      return `<script type="module" src="/src/main.ts"></script>
  <style id="vite-suspense-styles">
    body { visibility: hidden; opacity: 0; transition: opacity 0.2s ease-in; }
    body.vite-ready { visibility: visible; opacity: 1; }
  </style>
  <script type="module">
    await import('/src/main.ts'); /* Wait for Vite client and main module to load */
    await new Promise(resolve => setTimeout(resolve, 50)); /* Small delay to ensure styles are applied */
    document.body.classList.add('vite-ready'); /* Show content */
    document.getElementById('vite-suspense-styles')?.remove(); /* Remove suspense styles */
  </script>
      `.trim()
    }

    let html = ''
    if (viteAssets.main) {
      html += `<script type="module" src="/${viteAssets.main}"></script>\n`
    }
    if (viteAssets.css?.length) {
      for (const href of viteAssets.css) {
        html += `  <link rel="stylesheet" href="/${href}">\n`
      }
    }
    return html
  }

  // Include renderAssets in the context data
  const context = { ...data, isDev, viteAssets, renderAssets }

  // Render the template with the prepared context
  const result = await vnt.run(relPath, context)
  const htmlContent = result?.content || ''

  // Determine if minification should be applied
  let shouldMinify = false
  let minifyOpts = MINIFY_OPTIONS

  if (typeof minify === 'object' && minify !== null) {
    // User provided custom minify options
    shouldMinify = true
    minifyOpts = { ...MINIFY_OPTIONS, ...minify }
  } else if (minify === true) {
    // User enabled minification with default options
    shouldMinify = true
    minifyOpts = MINIFY_OPTIONS
  }

  // Minify HTML if enabled
  if (shouldMinify) {
    const minifiedHtml = await swcMinify(htmlContent, minifyOpts)
    return minifiedHtml.code
  }

  return htmlContent
}

/**
 * Extract Vite-generated assets (JS and CSS files) from the build bundle.
 *
 * This function scans the Vite bundle to find:
 * - Main entry point JavaScript file (marked with isEntry: true)
 * - All CSS files generated during the build
 *
 * These assets are later injected into HTML templates via the viteAssets context variable.
 *
 * @param bundle - The Vite build bundle object containing all generated files
 * @returns Object with main JS file and array of CSS files
 *
 * @example
 * const assets = getViteAssetsFromBundle(bundle)
 * // Returns: { main: 'assets/main-abc123.js', css: ['assets/style-def456.css'] }
 */
function getViteAssetsFromBundle(bundle: Record<string, any>): { main: string; css: string[] } {
  let main = ''
  const css: string[] = []

  // Iterate through all files in the bundle
  for (const [fileName, chunk] of Object.entries(bundle)) {
    // Skip null or non-object entries (safety check)
    if (!chunk || typeof chunk !== 'object') {
      continue
    }

    // Find the main entry point JavaScript file
    if ('isEntry' in chunk && chunk.isEntry === true && fileName.endsWith('.js')) {
      main = fileName
    }

    // Collect all CSS files
    if (fileName.endsWith('.css')) {
      css.push(fileName)
    }
  }

  return { main, css }
}

/**
 * Find all .vto template files in the pages directory.
 *
 * Recursively scans the pages directory for all files with .vto extension.
 * These templates will be rendered to HTML during the build process.
 *
 * @param pagesDir - Absolute path to the pages directory
 * @returns Array of absolute paths to all .vto template files
 *
 * @example
 * const files = await findVtoFiles('/project/src/pages')
 * // Returns: ['/project/src/pages/index.vto', '/project/src/pages/about.vto', ...]
 */
async function findVtoFiles(pagesDir: string): Promise<string[]> {
  const files: string[] = []
  for await (const file of glob('**/*.vto', { cwd: pagesDir })) {
    files.push(path.resolve(pagesDir, file))
  }
  return files
}

/**
 * Vitto Vite plugin for rendering Vento templates to static HTML.
 *
 * This plugin integrates the Vento template engine with Vite to provide:
 * - Server-side rendering of .vto templates to HTML
 * - Static site generation with dynamic routes
 * - Hot module reloading in development mode
 * - HTML minification in production builds
 * - Automatic asset injection (JS/CSS)
 *
 * @param opts - Plugin configuration options
 * @returns Vite plugin instance
 *
 * @example
 * // vite.config.ts
 * export default defineConfig({
 *   plugins: [
 *     vitto({
 *       minify: true,
 *       hooks: { posts: postsHook },
 *       dynamicRoutes: [{
 *         template: 'post',
 *         dataSource: 'posts',
 *         getParams: (post) => ({ id: post.id }),
 *         getPath: (post) => `blog/${post.id}.html`
 *       }]
 *     })
 *   ]
 * })
 */
export function vitto(opts: VittoOptions = DEFAULT_OPTS): Plugin {
  return {
    name: 'vitto',

    /**
     * Modify Vite configuration before it's resolved.
     * Removes default rolldown input to prevent conflicts with our custom HTML generation.
     */
    config(config) {
      if (config.build?.rolldownOptions?.input) {
        delete config.build.rolldownOptions.input
      }
    },

    /**
     * Store Vite configuration values after they're resolved.
     * We need the root directory for resolving template paths.
     */
    configResolved(config: ResolvedConfig) {
      viteRoot = config.root
    },

    /**
     * Log when the build process starts.
     */
    buildStart() {
      _console.log('Vitto build started')
    },

    /**
     * Generate static HTML files from templates during the build process.
     *
     * This hook is called by Vite during the build phase. It:
     * 1. Finds all .vto template files in the pages directory
     * 2. Extracts Vite assets (JS/CSS) from the bundle
     * 3. Renders regular pages (excluding dynamic route templates)
     * 4. Generates static HTML files for dynamic routes
     * 5. Emits all HTML files to the bundle (so they appear in build output)
     *
     * The emitFile() call is important because it makes Vite aware of these
     * files and includes them in the build output and statistics.
     */
    async generateBundle(_, bundle) {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = await findVtoFiles(pagesDir)

      // Extract JS and CSS assets from the Vite bundle
      const viteAssets = opts.assets ?? getViteAssetsFromBundle(bundle)

      if (!viteAssets.main) {
        _console.warn('No main asset found. HTML files may not include JS/CSS.')
      }

      // Get list of templates that are used for dynamic routes
      // These should not be rendered as standalone pages
      const dynamicTemplates = (opts.dynamicRoutes || []).map((config) => `${config.template}.vto`)

      // Render regular template files (static pages)
      for (const filePath of files) {
        const fileName = path.basename(filePath)

        // Skip templates that are used for dynamic route generation
        if (dynamicTemplates.includes(fileName)) {
          _console.debug(`Skipping ${fileName} (used for dynamic routes)`)
          continue
        }

        // Fetch data for this page via hooks
        const data = await getPageData(filePath, opts)

        // Render template to HTML
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

        // Calculate output path relative to pages directory
        const relPath = path.relative(pagesDir, filePath)
        const outName = relPath.replace(/\.vto$/, '.html')

        // Emit HTML file to Vite bundle
        // This makes the file appear in build output and statistics
        this.emitFile({
          type: 'asset',
          fileName: outName,
          source: html,
        })
      }

      // Generate static HTML files for dynamic routes
      const dynamicRouteConfigs = opts.dynamicRoutes || []
      for (const config of dynamicRouteConfigs) {
        const templatePath = path.resolve(pagesDir, `${config.template}.vto`)

        // Verify template file exists
        if (!fs.existsSync(templatePath)) {
          _console.warn(`Template not found: ${templatePath}`)
          continue
        }

        // Verify data source hook exists
        const dataHook = opts.hooks?.[config.dataSource]
        if (!dataHook) {
          _console.warn(`Data source hook not found: ${config.dataSource}`)
          continue
        }

        // Fetch all items from the data source
        const hookResult = await dataHook({})
        const dataItems = Array.isArray(hookResult) ? hookResult : hookResult[config.dataSource]

        if (!Array.isArray(dataItems)) {
          _console.warn(`Data source hook ${config.dataSource} did not return an array`)
          continue
        }

        _console.start(`Generating ${dataItems.length} pages from ${config.template}.vto`)

        // Generate a static HTML file for each item
        for (const item of dataItems) {
          try {
            // Extract route parameters for this item
            const params = config.getParams(item)

            // Fetch page-specific data (will transform to singular form)
            const pageData = await getPageData(templatePath, opts, params)

            // Render template with this item's data
            const html = await renderVentoToHtml(
              {
                filePath: templatePath,
                data: pageData,
                isDev: false,
                assets: viteAssets,
                minify: opts.minify ?? false,
              },
              opts.ventoOptions
            )

            // Get output path for this item (e.g., 'blog/1.html')
            const outPath = config.getPath(item)

            // Emit HTML file to Vite bundle
            this.emitFile({
              type: 'asset',
              fileName: outPath,
              source: html,
            })
          } catch (error) {
            _console.error(`Error generating page for item:`, item, error)
          }
        }

        _console.success(`Generated ${dataItems.length} pages`)
      }

      _console.success('Vitto rendering completed!')
    },

    /**
     * Configure the development server to handle .vto template requests.
     *
     * This middleware intercepts HTTP requests and:
     * 1. Checks if the URL matches a dynamic route pattern
     * 2. Checks if the URL maps to a static .vto template
     * 3. Blocks direct access to templates used in dynamic routes
     * 4. Renders the appropriate template with data from hooks
     * 5. Returns 404 for non-existent pages
     *
     * The middleware runs on every GET request in development mode,
     * providing hot reloading and dynamic route handling.
     */
    configureServer(server) {
      // Pre-calculate dynamic route patterns for efficient matching
      const dynamicRoutePatterns = createDynamicRoutePatterns(opts)

      // Get list of templates that should not be directly accessible
      const dynamicTemplates = (opts.dynamicRoutes || []).map((config) => `${config.template}.vto`)

      server.middlewares.use(async (req, res, next) => {
        // Only handle GET requests
        if (req.method !== 'GET') return next()

        // Parse URL into pathname and query string
        const [pathname, search = ''] = req.url?.split('?') ?? ['/']
        const url = pathname || '/'

        // Skip requests for static files, Vite internal routes, etc.
        if (
          /\.[a-zA-Z0-9]+$/.test(url) ||
          url.startsWith('/@vite/') ||
          url.startsWith('/@id/') ||
          url.startsWith('/node_modules/') ||
          url.startsWith('/assets/')
        ) {
          return next()
        }

        const pagesDir = path.resolve(
          viteRoot,
          opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages'
        )

        // Check if URL matches any dynamic route pattern
        for (const route of dynamicRoutePatterns) {
          const match = url.match(route.pattern)
          if (match) {
            // Extract the dynamic segment (e.g., post ID or slug)
            const [, slug] = match
            const templatePath = path.resolve(pagesDir, `${route.template}.vto`)

            if (fs.existsSync(templatePath)) {
              // Parse query parameters
              const query = parseQuery(`?${search}`)

              // Combine query params with route params
              const params = {
                ...query,
                id: slug,
                slug: slug,
              }

              // Fetch data for this specific item
              const data = await getPageData(templatePath, opts, params)

              // Render template with item data
              const html = await renderVentoToHtml(
                {
                  filePath: templatePath,
                  data,
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
          }
        }

        // Handle regular static routes (not dynamic)
        const pageUrl = url === '/' ? '/index' : url
        let vtoPath = path.resolve(`${pagesDir + pageUrl}.vto`)

        // Try index.vto if direct path doesn't exist (e.g., /about -> /about/index.vto)
        if (!fs.existsSync(vtoPath)) {
          vtoPath = path.resolve(`${pagesDir + pageUrl}/index.vto`)
        }

        if (fs.existsSync(vtoPath)) {
          const fileName = path.basename(vtoPath)

          // Block direct access to templates used in dynamic routes
          // e.g., accessing /post directly should return 404
          if (dynamicTemplates.includes(fileName)) {
            const notFoundPath = path.resolve(pagesDir, '404.vto')

            // Try to render custom 404 page
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

            // Fallback to plain text 404
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain')
            res.end('404 Not Found')
            return
          }

          // Render the static page template
          const query = parseQuery(`?${search}`)
          const data = await getPageData(vtoPath, opts, query)
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

          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }

        // No matching template found, return 404
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

        next()
      })

      // Watch for changes in source files and trigger full page reload
      server.watcher.add([
        path.resolve(viteRoot, 'src/**/*.vto'),
        path.resolve(viteRoot, 'src/**/*.ts'),
        path.resolve(viteRoot, 'src/**/*.js'),
        path.resolve(viteRoot, 'src/**/*.css'),
        path.resolve(viteRoot, 'src/**/*.json'),
      ])

      // Trigger full reload when watched files change
      server.watcher.on('change', (file) => {
        if (file.endsWith('.vto') || file.startsWith(path.resolve(viteRoot, 'src/'))) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}
