import { defineCommand, runMain, showUsage } from 'citty'
import pkg from '../package.json' with { type: 'json' }
import generateProject from './generate'
import _console from './logger'
import { frameworkVariants } from './variant'

const main = defineCommand({
  meta: {
    name: 'create-vitto',
    version: pkg.version,
    description: pkg.description,
  },
  args: {
    name: {
      type: 'positional',
      description: `Project name (lowercase, kebab-case)`,
      valueHint: 'my-website',
      required: false,
    },
    preset: {
      type: 'string',
      description: 'Preset to use',
      alias: 'p',
    },
    overwrite: {
      type: 'boolean',
      description: 'Overwrite existing directory',
      default: false,
    },
    immediate: {
      type: 'boolean',
      description: 'Install dependencies and start dev server immediately',
      alias: 'i',
      default: false,
    },
    templates: {
      type: 'boolean',
      description: 'List all available templates',
      default: false,
    },
    help: {
      type: 'boolean',
      description: 'Print information about the application',
      default: false,
    },
    version: {
      type: 'boolean',
      description: 'Print version information',
      default: false,
    },
  },
  async run({ args, cmd }) {
    if (args.version) {
      _console.log(`create-vitto v${pkg.version}`)
      return
    }

    if (args.templates) {
      _console.log('Available templates:\n')
      frameworkVariants.forEach((variant) => {
        _console.log(`  ${variant.color(variant.name.padEnd(15))} - ${variant.display}`)
      })
      _console.log('')
      return
    }

    if (args.help || !args.name) {
      showUsage(cmd)
      return
    }

    if (args.preset && !frameworkVariants.find((v) => v.name === args.preset)) {
      _console.error(
        `Preset "${args.preset}" not found. Use --templates to see available templates.`
      )
      process.exit(1)
    }

    return await generateProject({
      name: args.name,
      preset: args.preset,
      overwrite: args.overwrite,
      immediate: args.immediate,
    })
  },
})

const runCmd = () => runMain(main)

export { runCmd }
