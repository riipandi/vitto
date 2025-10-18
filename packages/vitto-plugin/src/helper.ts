import { glob } from 'node:fs/promises'
import path from 'node:path'
import type { OutputStrategy } from './options'

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
export function getViteAssetsFromBundle(bundle: Record<string, any>): {
  main: string
  css: string[]
} {
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
 * Normalize path for comparison by removing trailing slashes.
 *
 * @param path - Path to normalize
 * @returns Normalized path without trailing slash (except root)
 *
 * @example
 * normalizePath('/about/') // Returns: '/about'
 * normalizePath('/') // Returns: '/'
 */
export function normalizePath(path: string): string {
  if (path === '/' || !path) return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
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
export async function findVtoFiles(pagesDir: string): Promise<string[]> {
  const files: string[] = []
  for await (const file of glob('**/*.vto', { cwd: pagesDir })) {
    files.push(path.resolve(pagesDir, file))
  }
  return files
}

/**
 * Convert URL path based on output strategy.
 *
 * @param urlPath - Original URL path (e.g., '/about', '/blog/1')
 * @param strategy - Output strategy ('html' or 'directory')
 * @returns URL path that matches the output strategy
 *
 * @example
 * convertUrlPath('/about', 'html') // Returns: '/about'
 * convertUrlPath('/about', 'directory') // Returns: '/about/'
 */
export function convertUrlPath(urlPath: string, strategy?: OutputStrategy): string {
  // For html strategy, return as is
  if (strategy !== 'directory') {
    return urlPath
  }

  // For directory strategy, ensure trailing slash (except for root)
  if (urlPath === '' || urlPath === '/') {
    return '/'
  }

  return urlPath.endsWith('/') ? urlPath : `${urlPath}/`
}
