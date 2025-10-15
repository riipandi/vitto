import type { Options as MinifyOptions } from '@swc/html'
import type { Options as VentoOptions } from 'ventojs'

/**
 * Configuration for static generation of dynamic pages.
 */
export interface StaticGenConfig {
  /**
   * Template file name (without .vto extension) to use for generation.
   * @example 'post'
   */
  template: string

  /**
   * Hook name to fetch data for generating pages.
   * @example 'posts'
   */
  dataHook: string

  /**
   * Function to extract route params from each data item.
   * @example (post) => ({ id: post.id, slug: post.slug })
   */
  getParams: (item: any) => Record<string, any>

  /**
   * Function to generate output path from data item.
   * @example (post) => `blog/${post.id}.html`
   */
  getPath: (item: any) => string
}

/**
 * Options for the Vitto Vite plugin.
 */
export interface VittoOptions {
  /**
   * Directory containing page templates.
   * @default 'src/pages'
   */
  pagesDir?: string

  /**
   * Directory containing layout templates.
   * @default 'src/layouts'
   */
  layoutsDir?: string

  /**
   * Directory containing partial templates.
   * @default 'src/partials'
   */
  partialsDir?: string

  /**
   * Minify HTML output. If true, uses default minify options.
   * If object, merges with default minify options.
   * @default false
   */
  minify?: boolean | Partial<MinifyOptions>

  /**
   * Override Vite assets (main JS and CSS) for template injection.
   */
  assets?: { main: string; css: string[] }

  /**
   * Options to pass to Vento template engine.
   */
  ventoOptions?: Partial<VentoOptions>

  /**
   * Directory containing hook files for auto-discovery.
   * Hook files should export a default function created with `defineHooks()`.
   *
   * @default 'hooks'
   * @example
   * // hooks/posts.ts
   * import { defineHooks } from './plugin'
   * export default defineHooks('posts', async () => {
   *   const res = await fetch('https://api.example.com/posts')
   *   return res.json()
   * })
   */
  hooksDir?: string

  /**
   * Manual hook registration for injecting dynamic data into page templates.
   *
   * Each hook is a function that returns data to be injected into the template context.
   * The object key must match the page filename (without .vto extension).
   *
   * @example
   * // For blog.vto page
   * hooks: {
   *   blog: defineHooks('posts', async (params) => {
   *     const page = params?._page ?? 1
   *     const limit = params?._limit ?? 10
   *     const res = await fetch(`https://api.example.com/posts?page=${page}&limit=${limit}`)
   *     return res.json()
   *   })
   * }
   *
   * // In blog.vto template, access data via:
   * // {{ posts }}
   *
   * @remarks
   * - Hook key (e.g., 'blog') must match the page filename (blog.vto)
   * - Use `defineHooks(variableName, handler)` to define the data variable name
   * - Handler function receives query parameters from the URL
   * - Handler can be sync or async
   * - Returned data is automatically injected into template context
   */
  hooks?: Record<string, (params?: any) => Promise<any>>

  /**
   * Configuration for static generation of dynamic pages.
   *
   * This allows you to pre-render pages with dynamic content at build time.
   *
   * @example
   * staticGen: [
   *   {
   *     template: 'post',
   *     dataHook: 'posts',
   *     getParams: (post) => ({ id: post.id }),
   *     getPath: (post) => `blog/${post.id}.html`
   *   }
   * ]
   */
  staticGen?: StaticGenConfig[]
}

/**
 * Default options for Vitto plugin.
 */
export const DEFAULT_OPTS: VittoOptions = {
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  partialsDir: 'src/partials',
  minify: false,
  assets: undefined,
  hooksDir: 'hooks',
  staticGen: [],
}

// Configuration for HTML minifier
export const MINIFY_OPTIONS: MinifyOptions = {
  collapseBooleanAttributes: true,
  collapseWhitespaces: 'all',
  minifyCss: { lib: 'lightningcss' },
  minifyJs: true,
  minifyJson: true,
  normalizeAttributes: true,
  quotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeEmptyMetadataElements: true,
  removeRedundantAttributes: 'all',
  selfClosingVoidElements: true,
  sortAttributes: true,
  sortSpaceSeparatedAttributeValues: true,
  tagOmission: true,
} as const
