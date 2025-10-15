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

      // Get Vite assets from the bundle
      const viteAssets = opts.assets ?? getViteAssetsFromBundle(bundle)

      if (!viteAssets.main) {
        _console.warn('No main asset found. HTML files may not include JS/CSS.')
      }

      // Render regular template files (exclude templates used in staticGen)
      const staticGenTemplates = (opts.staticGen || []).map((config) => `${config.template}.vto`)

      for (const filePath of files) {
        const fileName = path.basename(filePath)

        // Skip templates that are used for static generation
        if (staticGenTemplates.includes(fileName)) {
          _console.debug(`Skipping ${fileName} (used for static generation)`)
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

      // Handle static generation of dynamic pages
      const staticGenConfigs = opts.staticGen || []
      for (const config of staticGenConfigs) {
        const templatePath = path.resolve(pagesDir, `${config.template}.vto`)
        if (!fs.existsSync(templatePath)) {
          _console.warn(`Template not found: ${templatePath}`)
          continue
        }

        const dataHook = opts.hooks?.[config.dataHook]
        if (!dataHook) {
          _console.warn(`Data hook not found: ${config.dataHook}`)
          continue
        }

        const hookResult = await dataHook({})
        const dataItems = Array.isArray(hookResult) ? hookResult : hookResult[config.dataHook]

        if (!Array.isArray(dataItems)) {
          _console.warn(`Data hook ${config.dataHook} did not return an array`)
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

        // Special handling for /blog/slug pattern -> use post.vto
        const blogPostMatch = url.match(/^\/blog\/([^/]+)$/)
        if (blogPostMatch) {
          const [, slug] = blogPostMatch
          const postVtoPath = path.resolve(pagesDir, 'post.vto')

          if (fs.existsSync(postVtoPath)) {
            const query = parseQuery(`?${search}`)
            const params = {
              ...query,
              id: slug,
              slug: slug,
            }

            const data = await getPageData(postVtoPath, opts, params)
            const html = await renderVentoToHtml(
              {
                filePath: postVtoPath,
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

        // Handle regular routes
        const pageUrl = url === '/' ? '/index' : url
        let vtoPath = path.resolve(`${pagesDir + pageUrl}.vto`)
        if (!fs.existsSync(vtoPath)) {
          vtoPath = path.resolve(`${pagesDir + pageUrl}/index.vto`)
        }

        if (fs.existsSync(vtoPath)) {
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
