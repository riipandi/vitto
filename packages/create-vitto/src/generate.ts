import { chroma } from 'itty-chroma'
import { frameworkVariants, type TemplateVariant } from './variant'

interface ProjectOptions {
  name: string
  template?: TemplateVariant['name']
}

export default async function generateProject(opts: ProjectOptions) {
  const variant = frameworkVariants.find((v) => v.name === opts.template) ?? frameworkVariants[0]

  chroma.log(`Generating "${opts.name}" project with ${variant?.display} template...`)
}
