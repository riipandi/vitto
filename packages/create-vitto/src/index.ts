import { defineCommand, runMain, showUsage } from 'citty'
import { chroma } from 'itty-chroma'
import pkg from '../package.json' with { type: 'json' }
import generateProject from './generate'

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
    // Show help page if --help flag is used or no subcommand provided
    if (args.help || args._.length === 0) {
      showUsage(cmd)
      return
    }

    // Show version info if --version flag is used
    if (args.version) {
      try {
        if (args.short) {
          chroma.log(pkg.version)
          return
        }
        chroma.log(`create-vitto v${pkg.version}`)
      } catch (error) {
        chroma.error('Failed to run command:', error)
        process.exit(1)
      }
      return
    }

    if (!args.name) {
      chroma.error('Please provide a project name.')
      showUsage(cmd)
      return
    }

    return await generateProject({
      name: args.name,
    })
  },
})

const runCmd = () => runMain(main)

export { runCmd }
