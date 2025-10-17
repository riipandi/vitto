import path from 'node:path'
import type { VittoOptions } from './options'

/**
 * Define a hook for injecting dynamic data into page templates.
 *
 * A hook is a function that fetches or generates data to be injected into templates.
 * The data will be available in the template context under the specified variable name.
 *
 * @template T - Type of data returned by the handler
 * @template P - Type of parameters accepted by the handler
 *
 * @param name - Variable name to use in the template (e.g., 'posts', 'products')
 * @param handler - Function that returns the data (can be sync or async)
 *
 * @returns A hook function that wraps the result in an object with the specified name
 *
 * @example
 * // Define a hook for fetching posts
 * const postsHook = defineHooks('posts', async (params) => {
 *   const res = await fetch('https://api.example.com/posts')
 *   return res.json()
 * })
 *
 * // In template, access data via: {{ posts }}
 */
export function defineHooks<T = any, P = any>(
  name: string,
  handler: (params?: P) => Promise<T> | T
) {
  return async (params?: P) => {
    const result = await Promise.resolve(handler(params))
    // Wrap result in an object with the hook name as key
    // e.g., { posts: [...] } or { products: [...] }
    return { [name]: result }
  }
}

/**
 * Retrieve dynamic data for a specific page by executing its registered hook.
 *
 * This function is called during both development and build time to fetch data
 * for rendering templates. It handles both regular pages and dynamic routes.
 *
 * @param filePath - Full path to the template file being rendered
 * @param opts - Vitto plugin options containing hooks and dynamic route configs
 * @param params - Query parameters or route params to pass to the hook
 *
 * @returns Object containing data to inject into the template context
 *
 * @example
 * // For blog.vto with no params
 * const data = await getPageData('src/pages/blog.vto', opts)
 * // Returns: { posts: [{...}, {...}] }
 *
 * // For post.vto with params
 * const data = await getPageData('src/pages/post.vto', opts, { id: '1' })
 * // Returns: { post: {...} }
 */
export async function getPageData(filePath?: string, opts?: VittoOptions, params?: any) {
  const hooks: Record<string, any> = opts?.hooks || {}
  const pageName = filePath ? path.basename(filePath, '.vto') : ''

  // Check if this template is used for dynamic routes
  const dynamicRoute = (opts?.dynamicRoutes || []).find((route) => route.template === pageName)

  if (dynamicRoute) {
    const hookName = dynamicRoute.dataSource
    if (hooks[hookName]) {
      // Execute the data source hook with provided params
      const result = await hooks[hookName](params || {})

      // Extract the actual data from the hook result
      // Hook returns { posts: [...] } or { posts: {...} }
      const hookData = result[hookName]

      // If data is an array, it's for listing pages (e.g., blog index)
      // Keep the plural form: { posts: [...] }
      if (Array.isArray(hookData)) {
        return { [hookName]: hookData }
      }

      // If data is a single object, it's for detail pages (e.g., single post)
      // Transform to singular form using template name: { post: {...} }
      // This makes it more intuitive in templates ({{ post.title }} vs {{ posts.title }})
      return { [dynamicRoute.template]: hookData }
    }
  }

  // For regular pages (not dynamic routes), execute the matching hook if it exists
  // The hook name must match the page filename (e.g., blog.vto → blog hook)
  if (hooks[pageName]) {
    return await hooks[pageName](params || {})
  }

  // Return empty object if no hook is registered for this page
  // This allows templates to work without hooks (static content only)
  return {}
}

/**
 * Create URL patterns for dynamic routes based on plugin configuration.
 *
 * This function analyzes the dynamicRoutes config to extract URL patterns
 * that should be handled dynamically in development mode.
 *
 * For example, if getPath returns `blog/${post.id}.html`, this function
 * extracts the base path 'blog' and creates a regex pattern to match
 * URLs like /blog/1, /blog/my-post, etc.
 *
 * @param opts - Vitto plugin options containing dynamic route configurations
 * @returns Array of route patterns with regex, base path, and template name
 *
 * @example
 * // For config: getPath: (post) => `blog/${post.id}.html`
 * const routes = createDynamicRoutePatterns(opts)
 * // Returns: [{
 * //   pattern: /^\/blog\/([^/]+)$/,
 * //   basePath: 'blog',
 * //   template: 'post'
 * // }]
 */
export function createDynamicRoutePatterns(opts: VittoOptions) {
  const routes: Array<{
    pattern: RegExp
    basePath: string
    template: string
  }> = []

  for (const config of opts.dynamicRoutes || []) {
    // Extract base path by calling getPath with dummy data
    // e.g., `blog/${post.id}.html` with { id: ':id' } returns 'blog/:id.html'
    const samplePath = config.getPath({ id: ':id', slug: ':slug' })
    const pathWithoutHtml = samplePath.replace(/\.html$/, '')

    // Split path and extract base (everything before the dynamic segment)
    // e.g., 'blog/:id' -> ['blog', ':id'] -> basePath: 'blog'
    const parts = pathWithoutHtml.split('/')
    const basePath = parts.slice(0, -1).join('/')

    // Create regex pattern to match URLs like /blog/123 or /blog/my-slug
    // The captured group ([^/]+) will contain the dynamic segment value
    const pattern = new RegExp(`^/${basePath}/([^/]+)$`)

    routes.push({
      pattern,
      basePath,
      template: config.template,
    })
  }

  return routes
}
