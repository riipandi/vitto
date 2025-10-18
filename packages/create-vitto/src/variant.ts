import { styleText } from 'node:util'

type ColorFunction = (text: string) => string

export type TemplateVariant = {
  name: string
  display: string
  color: ColorFunction
  customCommand?: string
}

const frameworkVariants: TemplateVariant[] = [
  {
    name: 'basic',
    display: 'Basic',
    color: (text: string) => styleText('cyan', text),
  },
  {
    name: 'htmx',
    display: 'HTMX',
    color: (text: string) => styleText('blue', text),
  },
  {
    name: 'lit',
    display: 'Lit',
    color: (text: string) => styleText('magenta', text),
  },
  {
    name: 'open-props',
    display: 'Open Props',
    color: (text: string) => styleText('green', text),
  },
  {
    name: 'tailwindcss',
    display: 'Tailwind CSS',
    color: (text: string) => styleText('cyan', text),
  },
]

export { frameworkVariants }
