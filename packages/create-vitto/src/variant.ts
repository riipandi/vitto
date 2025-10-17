import { chroma } from 'itty-chroma'

export type TemplateVariant = {
  name: string
  display: string
  color?: typeof chroma
  customCommand?: string
}

const frameworkVariants: TemplateVariant[] = [
  {
    name: 'basic',
    display: 'Basic',
    color: chroma.cyan,
  },
  {
    name: 'htmx',
    display: 'HTMX',
    color: chroma.blue,
  },
  {
    name: 'lit',
    display: 'Lit',
    color: chroma.magenta,
  },
  {
    name: 'open-props',
    display: 'Open Props',
    color: chroma.green,
  },
  {
    name: 'tailwindcss',
    display: 'Tailwind CSS',
    color: chroma.cyan,
  },
]

export { frameworkVariants }
