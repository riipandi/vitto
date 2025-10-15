import type { Options as MinifyOptions } from '@swc/html'
import type { Options as VentoOptions } from 'ventojs'

/**
 * Configuration for dynamic route generation.
 *
 * Dynamic routes allow you to generate multiple static pages from a single template
 * based on data fetched from a hook. This is useful for blog posts, products, etc.
 *
 * @example
 * // Generate blog/1.html, blog/2.html, etc. from post.vto template
 * {
 *   template: 'post',
 *   dataSource: 'posts',
 *   getParams: (post) => ({ id: post.id }),
 *   getPath: (post) => `blog/${post.id}.html`
 * }
 */
export interface DynamicRouteConfig {
  /**
   * Template file name (without .vto extension) to use for generation.
   * This template will be used to render each dynamic page.
   *
   * @example 'post'
   */
  template: string

  /**
   * Hook name to fetch data for generating pages.
   * Must match a key in the `hooks` option.
   *
   * @example 'posts'
   */
  dataSource: string

  /**
   * Function to extract route params from each data item.
   * These params will be passed to the page hook when rendering.
   *
   * @param item - A single item from the data source array
   * @returns Object containing params to pass to the page hook
   *
   * @example (post) => ({ id: post.id, slug: post.slug })
   */
  getParams: (item: any) => Record<string, any>

  /**
   * Function to generate output file path from data item.
   * This determines where the generated HTML file will be saved.
   *
   * @param item - A single item from the data source array
   * @returns Output path relative to build output directory
   *
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
   * Configuration for dynamic route generation.
   *
   * Dynamic routes allow you to generate multiple static HTML pages from a single template.
   * This is useful for content like blog posts, products, documentation pages, etc.
   *
   * During development, these routes are handled dynamically (e.g., /blog/1, /blog/2).
   * During build, static HTML files are generated for each item (e.g., blog/1.html, blog/2.html).
   *
   * @example
   * dynamicRoutes: [
   *   {
   *     template: 'post',              // Use post.vto template
   *     dataSource: 'posts',           // Fetch data from 'posts' hook
   *     getParams: (post) => ({        // Extract params for each post
   *       id: post.id,
   *       slug: post.slug
   *     }),
   *     getPath: (post) => `blog/${post.id}.html`  // Output to blog/1.html, blog/2.html, etc.
   *   }
   * ]
   */
  dynamicRoutes?: DynamicRouteConfig[]
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
  dynamicRoutes: [],
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
