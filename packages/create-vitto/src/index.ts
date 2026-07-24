import { defineCommand, runMain, showUsage } from 'citty';

import pkg from '../package.json' with { type: 'json' };
import generateProject from './generate';
import _console from './logger';
import { frameworkVariants } from './variant';
import { runWizard } from './wizard';

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
      alias: 'P',
    },
    overwrite: {
      type: 'boolean',
      description: 'Overwrite existing directory',
      default: false,
    },
    start: {
      type: 'boolean',
      description: 'Install dependencies and start dev server immediately',
      alias: 's',
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
    packageManager: {
      type: 'string',
      description: 'Package manager to use (npm, yarn, pnpm, bun, deno)',
      default: 'pnpm',
      valueHint: 'pnpm',
    },
  },

  async run({ args, cmd }) {
    if (args.version) {
      _console.log(`create-vitto v${pkg.version}`);
      return;
    }

    if (args.templates) {
      _console.log('\nAvailable templates:\n');
      frameworkVariants.forEach((variant) => {
        _console.log(`  ${variant.color(variant.name.padEnd(15))} - ${variant.display}`);
      });
      _console.log('');
      return;
    }

    if (args.help) {
      showUsage(cmd);
      return;
    }

    // Run wizard if no name argument is provided
    if (!args.name) {
      const wizardResult = await runWizard();
      return await generateProject({
        name: wizardResult.name,
        preset: wizardResult.preset,
        overwrite: wizardResult.overwrite,
        start: wizardResult.start,
        packageManager: args.packageManager || wizardResult.packageManager,
      });
    }

    if (args.preset && !frameworkVariants.find((v) => v.name === args.preset)) {
      _console.error(
        `Preset "${args.preset}" not found. Use --templates to see available templates.`
      );
      process.exit(1);
    }

    return await generateProject({
      name: args.name,
      preset: args.preset,
      overwrite: args.overwrite,
      start: args.start,
      packageManager: args.packageManager,
    });
  },
});

const runCmd = () => runMain(main);

export { runCmd };
