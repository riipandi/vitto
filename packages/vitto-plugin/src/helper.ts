import { glob } from 'node:fs/promises';
import path from 'node:path';

import type { OutputStrategy } from './options';

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
  main: string;
  css: string[];
} {
  let main = '';
  const css: string[] = [];

  // Iterate through all files in the bundle
  for (const [fileName, chunk] of Object.entries(bundle)) {
    // Skip null or non-object entries (safety check)
    if (!chunk || typeof chunk !== 'object') {
      continue;
    }

    // Find the main entry point JavaScript file
    if ('isEntry' in chunk && chunk.isEntry === true && fileName.endsWith('.js')) {
      main = fileName;
    }

    // Collect all CSS files
    if (fileName.endsWith('.css')) {
      css.push(fileName);
    }
  }

  return { main, css };
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
  if (path === '/' || !path) return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
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
  const files: string[] = [];
  for await (const file of glob('**/*.vto', { cwd: pagesDir })) {
    files.push(path.resolve(pagesDir, file));
  }
  return files;
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
    return urlPath;
  }

  // For directory strategy, ensure trailing slash (except for root)
  if (urlPath === '' || urlPath === '/') {
    return '/';
  }

  return urlPath.endsWith('/') ? urlPath : `${urlPath}/`;
}

/**
 * Convert output path based on output strategy.
 *
 * @param outputPath - Original output path (e.g., 'about.html', 'blog/1.html')
 * @param strategy - Output strategy ('html' or 'directory')
 * @returns Converted path based on strategy
 *
 * @example
 * // html strategy
 * convertOutputPath('about.html', 'html') // Returns: 'about.html'
 *
 * @example
 * // directory strategy
 * convertOutputPath('about.html', 'directory') // Returns: 'about/index.html'
 * convertOutputPath('blog/1.html', 'directory') // Returns: 'blog/1/index.html'
 */
export function convertOutputPath(outputPath: string, strategy?: OutputStrategy): string {
  // If strategy is 'html' or undefined, return original path
  if (strategy !== 'directory') {
    return outputPath;
  }

  // If already index.html, keep it as is
  if (outputPath.endsWith('index.html')) {
    return outputPath;
  }

  // Convert page.html to page/index.html
  // Convert dir/page.html to dir/page/page.html
  return outputPath.replace(/\.html$/, '/index.html');
}

/**
 * Pagination result for hooks to return.
 */
export interface PaginatedData<T> {
  /** Items for the current page */
  items: T[];
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** URL to previous page */
  prevUrl?: string | null;
  /** URL to next page */
  nextUrl?: string | null;
  /** URL to first page */
  firstUrl?: string;
  /** URL to last page */
  lastUrl?: string;
}

/**
 * Options for creating a paginated result.
 */
export interface PaginateOptions {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items (defaults to items.length) */
  totalItems?: number;
}

/**
 * Paginate an array of items into pages.
 *
 * @param items - The array of items to paginate
 * @param options - Pagination options or just the page number (defaults to pageSize: 10)
 * @returns Paginated data with items, page info, and navigation helpers
 *
 * @example
 * const result = paginate(posts, { page: 1, pageSize: 10 });
 * // Returns: { items: [...], page: 1, pageSize: 10, totalPages: 5, ... }
 */
export function paginate<T>(
  items: T[],
  options: number | Partial<PaginateOptions>
): PaginatedData<T> {
  const page = typeof options === 'number' ? options : (options.page ?? 1);
  const pageSize = typeof options === 'number' ? 10 : (options.pageSize ?? 10);
  const totalItems =
    typeof options === 'number' ? items.length : (options.totalItems ?? items.length);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * Build a paginated data context with URL helpers.
 *
 * Produces a PaginatedData object with prevUrl/nextUrl/firstUrl/lastUrl
 * computed from the output path strategy and getPath function.
 * Use this for both build-time and dev-mode paginated routes.
 *
 * @param items - Full array of items to paginate
 * @param opts.pageNum - Current page number (1-based)
 * @param opts.pageSize - Items per page
 * @param opts.totalItems - Total item count (defaults to items.length)
 * @param opts.outputStrategy - Output strategy for URL generation
 * @param opts.getPath - Path generator function for each page number
 * @returns Paginated data with items, pagination metadata, and URL helpers
 */
export function buildPaginatedContext<T>(
  items: T[],
  opts: {
    pageNum: number;
    pageSize: number;
    totalItems?: number;
    outputStrategy?: OutputStrategy;
    getPath: (pageNum: number) => string;
  }
): PaginatedData<T> {
  const { pageNum, pageSize, totalItems, outputStrategy, getPath } = opts;
  const paginated = paginate(items, { page: pageNum, pageSize, totalItems });
  const totalPages = paginated.totalPages;

  const toUrl = (page: number): string => {
    const filePath = getPath(page);
    const outPath = convertOutputPath(filePath, outputStrategy);
    return '/' + outPath.replace(/index\.html$/, '').replace(/\.html$/, '');
  };

  return {
    ...paginated,
    prevUrl: pageNum > 1 ? toUrl(pageNum - 1) : null,
    nextUrl: pageNum < totalPages ? toUrl(pageNum + 1) : null,
    firstUrl: toUrl(1),
    lastUrl: toUrl(totalPages),
  };
}
