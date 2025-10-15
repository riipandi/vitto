export interface VittoOptions {
  pagesDir?: string
  layoutsDir?: string
  partialsDir?: string
}

export const DEFAULT_OPTS: VittoOptions = {
  pagesDir: 'src/pages',
  layoutsDir: 'src/layouts',
  partialsDir: 'src/partials',
}
