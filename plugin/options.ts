import { type Options as MinifyOptions } from '@swc/html'

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
