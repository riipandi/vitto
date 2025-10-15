/**
 * Configuration for a single hook.
 * @template T - The return type of the handler.
 * @template P - The parameter type accepted by the handler.
 * @property name - The variable name to be injected into the template context.
 * @property handler - A function (sync or async) that returns the value for the variable.
 *   Receives an optional parameter for dynamic data fetching or computation.
 */
export type HookConfig<T = any, P = any> = {
  name: string
  handler: (params?: P) => Promise<T> | T
}

/**
 * Executes all hooks and returns an object containing their results.
 * Each hook can receive an optional parameter (e.g., for dynamic routes).
 * The returned object maps each hook's name to its resolved value,
 * making it suitable for injecting into a template engine context.
 *
 * @param configs - Array of hook configurations.
 * @param params - Optional parameters for each handler, keyed by hook name.
 * @returns An object with keys as hook names and values as handler results.
 */
export async function defineHooks<
  T extends Record<string, any> = any,
  P extends Record<string, any> = any,
>(configs: HookConfig[], params?: P): Promise<T> {
  const results: Record<string, any> = {}
  for (const { name, handler } of configs) {
    results[name] = await Promise.resolve(handler(params?.[name]))
  }
  return results as T
}
