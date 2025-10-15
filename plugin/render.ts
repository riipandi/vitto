import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { type Options as MinifyOptions, minify as swcMinify } from '@swc/html'
import { parseQuery } from 'ufo'
import vento, { type Options as VentoOptions } from 'ventojs'
import autoTrim, { defaultTags } from 'ventojs/plugins/auto_trim.js'
import type { Plugin, ResolvedConfig } from 'vite'
import { getPageData } from './hooks'
import { _console } from './logger'
import { DEFAULT_OPTS, MINIFY_OPTIONS, type VittoOptions } from './options'

// Global variable to store Vite root directory
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
  vnt.use(autoTrim({ tags: [...defaultTags] }))

  const includesDir = typeof ventoOptions.includes === 'string' ? ventoOptions.includes : ''
  const relPath = path.relative(includesDir, filePath)
  const viteAssets = assets ?? { main: '', css: [] }
  const context = { ...data, isDev, viteAssets }

  const result = await vnt.run(relPath, context)
  const htmlContent = result?.content || ''

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
 * Extract Vite-generated assets from the build manifest in bundle.
 */
function getViteAssetsFromBundle(bundle: Record<string, any>): { main: string; css: string[] } {
  let main = ''
  const css: string[] = []

  // Find main JS entry and CSS files from the bundle
  for (const [fileName, chunk] of Object.entries(bundle)) {
    // Skip null or non-object entries
    if (!chunk || typeof chunk !== 'object') {
      continue
    }

    // Check if this is an entry point JS file
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
 */
async function findVtoFiles(pagesDir: string): Promise<string[]> {
  const files: string[] = []
  for await (const file of glob('**/*.vto', { cwd: pagesDir })) {
    files.push(path.resolve(pagesDir, file))
  }
  return files
}

/**
 * Create dynamic route patterns from dynamicRoutes config.
 * Extracts the base path from getPath function.
 *
 * @example
 * // For getPath: (post) => `blog/${post.id}.html`
 * // Returns: { pattern: /^\/blog\/([^/]+)$/, basePath: 'blog' }
 */
function createDynamicRoutePatterns(opts: VittoOptions) {
  const routes: Array<{
    pattern: RegExp
    basePath: string
    template: string
  }> = []

  for (const config of opts.dynamicRoutes || []) {
    // Try to extract base path from a sample getPath call
    const samplePath = config.getPath({ id: ':id', slug: ':slug' })
    const pathWithoutHtml = samplePath.replace(/\.html$/, '')

    // Extract base path (everything before the dynamic segment)
    const parts = pathWithoutHtml.split('/')
    const basePath = parts.slice(0, -1).join('/')

    // Create regex pattern to match URLs like /blog/123 or /blog/my-slug
    const pattern = new RegExp(`^/${basePath}/([^/]+)$`)

    routes.push({
      pattern,
      basePath,
      template: config.template,
    })
  }

  return routes
}

/**
 * Vitto Vite plugin for rendering Vento templates.
 */
export function vitto(opts: VittoOptions = DEFAULT_OPTS): Plugin {
  return {
    name: 'vitto',

    config(config) {
      if (config.build?.rolldownOptions?.input) {
        delete config.build.rolldownOptions.input
      }
    },

    configResolved(config: ResolvedConfig) {
      viteRoot = config.root
    },

    buildStart() {
      _console.log('Vitto build started')
    },

    /**
     * Use generateBundle to emit files - this way they appear in Vite's output log.
     */
    async generateBundle(_, bundle) {
      const pagesDir = path.resolve(viteRoot, opts.pagesDir || DEFAULT_OPTS.pagesDir || 'src/pages')
      const files = await findVtoFiles(pagesDir)
      const viteAssets = opts.assets ?? getViteAssetsFromBundle(bundle)

      if (!viteAssets.main) {
        _console.warn('No main asset found. HTML files may not include JS/CSS.')
      }

      // Render regular template files (exclude templates used in dynamicRoutes)
      const dynamicTemplates = (opts.dynamicRoutes || []).map((config) => `${config.template}.vto`)

      for (const filePath of files) {
        const fileName = path.basename(filePath)

        // Skip templates that are used for dynamic routes
        if (dynamicTemplates.includes(fileName)) {
          _console.debug(`Skipping ${fileName} (used for dynamic routes)`)
          continue
        }

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

        // Emit file to bundle (this makes it appear in Vite's output log)
        this.emitFile({
          type: 'asset',
          fileName: outName,
          source: html,
        })
      }

      // Handle dynamic route generation
      const dynamicRouteConfigs = opts.dynamicRoutes || []
      for (const config of dynamicRouteConfigs) {
        const templatePath = path.resolve(pagesDir, `${config.template}.vto`)
        if (!fs.existsSync(templatePath)) {
          _console.warn(`Template not found: ${templatePath}`)
          continue
        }

        const dataHook = opts.hooks?.[config.dataSource]
        if (!dataHook) {
          _console.warn(`Data source hook not found: ${config.dataSource}`)
          continue
        }

        const hookResult = await dataHook({})
        const dataItems = Array.isArray(hookResult) ? hookResult : hookResult[config.dataSource]

        if (!Array.isArray(dataItems)) {
          _console.warn(`Data source hook ${config.dataSource} did not return an array`)
          continue
        }

        _console.start(`Generating ${dataItems.length} pages from ${config.template}.vto`)

        for (const item of dataItems) {
          try {
            const params = config.getParams(item)
            const pageData = await getPageData(templatePath, opts, params)

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

            const outPath = config.getPath(item)

            // Emit file to bundle (this makes it appear in Vite's output log)
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
     * Configure development server to handle .vto template requests.
     */
    configureServer(server) {
      // Create dynamic route patterns from dynamicRoutes config
      const dynamicRoutePatterns = createDynamicRoutePatterns(opts)

      // Get list of templates used in dynamicRoutes (these should not be accessible directly)
      const dynamicTemplates = (opts.dynamicRoutes || []).map((config) => `${config.template}.vto`)

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET') return next()

        const [pathname, search = ''] = req.url?.split('?') ?? ['/']
        const url = pathname || '/'

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

        // Handle dynamic routes
        for (const route of dynamicRoutePatterns) {
          const match = url.match(route.pattern)
          if (match) {
            const [, slug] = match
            const templatePath = path.resolve(pagesDir, `${route.template}.vto`)

            if (fs.existsSync(templatePath)) {
              const query = parseQuery(`?${search}`)
              const params = {
                ...query,
                id: slug,
                slug: slug,
              }

              const data = await getPageData(templatePath, opts, params)
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

        // Handle regular routes
        const pageUrl = url === '/' ? '/index' : url
        let vtoPath = path.resolve(`${pagesDir + pageUrl}.vto`)
        if (!fs.existsSync(vtoPath)) {
          vtoPath = path.resolve(`${pagesDir + pageUrl}/index.vto`)
        }

        if (fs.existsSync(vtoPath)) {
          const fileName = path.basename(vtoPath)

          // Block direct access to templates used in dynamicRoutes
          if (dynamicTemplates.includes(fileName)) {
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

            // Fallback 404 response
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain')
            res.end('404 Not Found')
            return
          }

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

        // Handle 404
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

      server.watcher.add([
        path.resolve(viteRoot, 'src/**/*.vto'),
        path.resolve(viteRoot, 'src/**/*.ts'),
        path.resolve(viteRoot, 'src/**/*.js'),
        path.resolve(viteRoot, 'src/**/*.css'),
        path.resolve(viteRoot, 'src/**/*.json'),
      ])

      server.watcher.on('change', (file) => {
        if (file.endsWith('.vto') || file.startsWith(path.resolve(viteRoot, 'src/'))) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}
