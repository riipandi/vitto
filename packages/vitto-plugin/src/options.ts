import type { Options as MinifyOptions } from '@swc/html';
import type { PagefindServiceConfig } from 'pagefind';
import type { Options as VentoOptions } from 'ventojs';

/**
 * Options for rendering a Vento template to HTML.
 */
export interface RenderOptions {
  /** Path to the .vto template file */
  filePath: string;
  /** Data to be injected into the template context */
  data?: Record<string, unknown>;
  /** Whether running in development mode */
  isDev?: boolean;
  /** Vite-generated assets (JS and CSS files) */
  assets?: { main: string; css: string[] };
  /** Whether to minify the output HTML */
  minify?: boolean | MinifyOptions;
}

/**
 * Configuration for dynamic route generation.
 *
 * Dynamic routes allow you to generate multiple static HTML pages from a single template.
 * This is useful for content like blog posts, product catalogs, documentation pages, etc.
 *
 * **Standard mode** (no pageSize): one page per data item.
 * - `getParams(item)` receives each item from the data source.
 * - `getPath(item)` receives each item.
 *
 * **Paginated mode** (pageSize > 0): one page per page number.
 * - `getParams(pageNum)` receives the 1-based page number.
 * - `getPath(pageNum)` receives the 1-based page number.
 *
 * @example
 * // Standard: generate blog/1.html, blog/2.html per post
 * {
 *   template: 'post',
 *   dataSource: 'posts',
 *   getParams: (post) => ({ id: post.id }),
 *   getPath: (post) => `blog/${post.slug}.html`
 * }
 *
 * @example
 * // Paginated: generate blog.html, blog/2.html per page
 * {
 *   template: 'blog',
 *   dataSource: 'posts',
 *   pageSize: 10,
 *   getParams: (pageNum) => ({ _page: pageNum }),
 *   getPath: (pageNum) => pageNum === 1 ? 'blog.html' : `blog/${pageNum}.html`
 * }
 */
export interface DynamicRouteConfig {
  /**
   * Template file name (without .vto extension) to use for generation.
   *
   * @example 'post'
   */
  template: string;

  /**
   * Hook name to fetch data for generating pages.
   * Must match a key in the `hooks` option.
   *
   * @example 'posts'
   */
  dataSource: string;

  /**
   * Number of items per page. When set (> 0), the route is paginated:
   * `getParams` and `getPath` receive a 1-based page number instead of an item.
   * When omitted or 0, standard mode: one page per item.
   *
   * @example 10
   */
  pageSize?: number;

  /**
   * Function to extract route parameters.
   *
   * - **Standard mode**: receives each item from the data source.
   * - **Paginated mode** (pageSize > 0): receives the 1-based page number.
   *
   * @example (post) => ({ id: post.id, slug: post.slug }) // standard
   * @example (pageNum) => ({ _page: pageNum })              // paginated
   */
  getParams: (itemOrPageNum: any) => Record<string, any>;

  /**
   * Function to generate output file path.
   *
   * - **Standard mode**: receives each item from the data source.
   * - **Paginated mode** (pageSize > 0): receives the 1-based page number.
   *
   * @example (post) => `blog/${post.slug}.html`                     // standard
   * @example (pageNum) => pageNum === 1 ? 'blog.html' : `blog/${pageNum}.html` // paginated
   */
  getPath: (itemOrPageNum: any) => string;
}

/**
 * Output strategy for generated HTML files.
 * - 'html': Generate files as page.html (e.g., about.html)
 * - 'directory': Generate files as page/index.html for clean URLs (e.g., about/index.html)
 */
export type OutputStrategy = 'html' | 'directory';

/**
 * Metadata interface for page templates.
 */
export interface Metadata {
  /**
   * Site name.
   */
  siteName: string;

  /**
   * Site title.
   */
  title: string;

  /**
   * Site description.
   */
  description?: string;

  /**
   * Site keywords.
   */
  keywords?: string[] | string;

  /**
   * Additional metadata fields.
   */
  [key: string]: any;
}

/**
 * Options for the Vitto Vite plugin.
 */
export interface VittoOptions {
  /**
   * Site metadata to inject into all page templates.
   */
  metadata: Metadata;

  /**
   * Directory containing page templates.
   * @default 'src/pages'
   */
  pagesDir?: string;

  /**
   * Directory containing layout templates.
   * @default 'src/layouts'
   */
  layoutsDir?: string;

  /**
   * Directory containing partial templates.
   * @default 'src/partials'
   */
  partialsDir?: string;

  /**
   * Minify HTML output. If true, uses default minify options.
   * If object, merges with default minify options.
   * @default false
   */
  minify?: boolean | Partial<MinifyOptions>;

  /**
   * Override Vite assets (main JS and CSS) for template injection.
   */
  assets?: { main: string; css: string[] };

  /**
   * Options to pass to Vento template engine.
   */
  ventoOptions?: Partial<VentoOptions>;

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
  hooks?: Record<string, (params?: any) => Promise<any>>;

  /**
   * Configuration for dynamic route generation.
   *
   * Dynamic routes allow you to generate multiple static HTML pages from a single template.
   * Each route config can be **standard** (one page per item) or **paginated** (one page per
   * page number, when `pageSize` is set). See {@link DynamicRouteConfig} for details.
   *
   * During development, these routes are handled dynamically (e.g., /blog/1, /blog/my-post).
   * During build, static HTML files are generated for each page.
   *
   * @example
   * // Standard mode: one page per item
   * dynamicRoutes: [
   *   {
   *     template: 'post',
   *     dataSource: 'posts',
   *     getParams: (post) => ({ id: post.id }),
   *     getPath: (post) => `blog/${post.id}.html`
   *   }
   * ]
   *
   * @example
   * // Paginated mode: one page per page number
   * dynamicRoutes: [
   *   {
   *     template: 'blog',
   *     dataSource: 'posts',
   *     pageSize: 10,
   *     getParams: (pageNum) => ({ _page: pageNum }),
   *     getPath: (pageNum) => pageNum === 1 ? 'blog.html' : `blog/${pageNum}.html`
   *   }
   * ]
   */
  dynamicRoutes?: DynamicRouteConfig[];

  /**
   * Enable automatic search index generation using Pagefind after build.
   *
   * When enabled, Pagefind will index all generated HTML files in the output directory
   * and create a client-side search index. The search UI can then be added to your site
   * to provide fast, static search functionality without a backend.
   *
   * The index is generated in the `closeBundle` hook after all files are written to disk.
   * Index files are written to `<outDir>/pagefind/` directory.
   *
   * @default true
   *
   * @example
   * // Enable search indexing (default)
   * enableSearchIndex: true
   *
   * @example
   * // Disable search indexing
   * enableSearchIndex: false
   *
   * @remarks
   * - Requires all HTML files to be written before indexing
   * - Index generation happens automatically after `vite build`
   * - Output directory is determined from Vite's `build.outDir` config
   * - Pagefind is optimized for static sites and runs entirely in the browser
   * - No server-side search backend required
   *
   * @see {@link https://pagefind.app/ | Pagefind Documentation}
   */
  enableSearchIndex?: boolean;

  /**
   * Configuration options for Pagefind search indexing.
   *
   * These options control how Pagefind generates the search index.
   * Only applies when `enableSearchIndex` is true.
   *
   * @default PAGEFIND_OPTIONS
   *
   * @example
   * pagefindOptions: {
   *   rootSelector: 'main',
   *   verbose: true
   * }
   *
   * @see {@link https://pagefind.app/docs/config-options/ | Pagefind Configuration Options}
   */
  pagefindOptions?: Partial<PagefindServiceConfig>;

  /**
   * Output strategy for generated HTML files.
   *
   * - `'html'`: Generate files as page.html (e.g., about.html, blog.html)
   * - `'directory'`: Generate files as page/index.html for clean URLs (e.g., about/index.html, blog/index.html)
   *
   * @default 'html'
   *
   * @example
   * // Traditional output (about.html, blog/1.html)
   * outputStrategy: 'html'
   *
   * @example
   * // Pretty URLs (about/index.html, blog/1/index.html)
   * outputStrategy: 'directory'
   */
  outputStrategy?: OutputStrategy;
}

export const PAGEFIND_OPTIONS: PagefindServiceConfig = {
  rootSelector: 'html',
  writePlayground: false,
  keepIndexUrl: true,
  verbose: false,
};

/**
 * Default options for Vitto plugin.
 */
export const DEFAULT_OPTS: VittoOptions = {
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  partialsDir: 'src/partials',
  minify: false,
  assets: undefined,
  dynamicRoutes: [],
  enableSearchIndex: true,
  pagefindOptions: PAGEFIND_OPTIONS,
  outputStrategy: 'html',
  metadata: {
    siteName: 'Vitto',
    title: 'Vitto Site',
  },
};

// Configuration for HTML minifier
export const MINIFY_OPTIONS: MinifyOptions = {
  collapseBooleanAttributes: true,
  collapseWhitespaces: 'conservative',
  minifyCss: { lib: 'lightningcss' },
  minifyJs: true,
  minifyJson: true,
  normalizeAttributes: true,
  quotes: true,
  removeComments: false,
  removeEmptyAttributes: false,
  removeEmptyMetadataElements: false,
  removeRedundantAttributes: 'all',
  selfClosingVoidElements: false,
  sortAttributes: true,
  sortSpaceSeparatedAttributeValues: true,
  tagOmission: false,
} as const;
