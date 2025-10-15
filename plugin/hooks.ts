import path from 'node:path'
import { VittoOptions } from './options'

/**
 * Define a hook for injecting dynamic data into page templates.
 *
 * This function creates a hook that associates a variable name with a data handler.
 * The handler is executed when the page is rendered, and its result is injected
 * into the template context under the specified variable name.
 *
 * @template T - The return type of the handler function.
 * @template P - The parameter type that the handler accepts (e.g., query params, route params).
 *
 * @param name - The variable name to be injected into the template context.
 *               This is how you'll access the data in your .vto templates.
 * @param handler - A function (sync or async) that fetches or computes the data.
 *                  Receives optional parameters for dynamic data fetching.
 *
 * @returns An async function that executes the handler and wraps the result
 *          in an object with the specified variable name as the key.
 *
 * @example
 * // Create a hook that fetches posts and injects them as 'posts' variable
 * export default defineHooks('posts', async (params) => {
 *   const page = params?._page ?? 1
 *   const res = await fetch(`https://api.example.com/posts?page=${page}`)
 *   return res.json()
 * })
 *
 * @example
 * // In your .vto template, access the data:
 * // {{ for post of posts }}
 * //   <h2>{{ post.title }}</h2>
 * // {{ /for }}
 */
export function defineHooks<T = any, P = any>(
  name: string,
  handler: (params?: P) => Promise<T> | T
) {
  return async (params?: P) => ({
    [name]: await Promise.resolve(handler(params)),
  })
}

/**
 * Retrieve dynamic data for a specific page by executing its registered hook.
 *
 * This function matches the page filename with registered hooks and executes
 * the corresponding hook handler to fetch data. The data is then merged into
 * the template context.
 *
 * @param filePath - The full path to the .vto template file being rendered.
 * @param opts - Vitto plugin options containing the hooks configuration.
 * @param params - Optional parameters (e.g., URL query params) to pass to the hook handler.
 *
 * @returns A promise that resolves to an object containing the hook data,
 *          or an empty object if no hook is registered for the page.
 *
 * @example
 * // For a file at 'src/pages/blog.vto' with a registered hook:
 * const data = await getPageData('/path/to/blog.vto', options, { _page: 1 })
 * // Returns: { posts: [...] }
 *
 * @remarks
 * - The page name is extracted from the filename (without .vto extension)
 * - Hook matching is case-sensitive and must exactly match the filename
 * - If no hook is found, returns an empty object (safe fallback)
 * - Parameters are passed directly to the hook handler for flexible data fetching
 */
export async function getPageData(filePath?: string, opts?: VittoOptions, params?: any) {
  const hooks: Record<string, any> = opts?.hooks || {}
  const pageName = filePath ? path.basename(filePath, '.vto') : ''

  // Execute the hook handler if one exists for this page
  if (hooks[pageName]) {
    return await hooks[pageName](params || {})
  }

  // Return empty object if no hook is registered (safe fallback)
  return {}
}
