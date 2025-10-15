export interface VentoPluginOptions {
  pagesDir?: string
  layoutsDir?: string
  partialsDir?: string
}

export const DEFAULT_OPTS: VentoPluginOptions = {
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  partialsDir: 'src/partials',
}
