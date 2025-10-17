import { defineCommand, runMain, showUsage } from 'citty'
import pkg from '../package.json' with { type: 'json' }

const runCmd = () =>
  runMain(
    defineCommand({
      meta: {
        name: 'create-vitto',
        version: pkg.version,
        description: pkg.description,
      },
      args: {
        help: {
          type: 'boolean',
          description: 'Print information about the application',
          default: false,
        },
      },
      subCommands: {
        version: () => import('./cmds/version').then((r) => r.default),
      },
      async run({ args, cmd }) {
        // Show help page if --help flag is used or no subcommand provided
        if (args.help || args._.length === 0) {
          showUsage(cmd)
          return
        }
      },
    })
  )

export { runCmd }
