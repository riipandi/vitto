import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

import _console from './logger';
import { frameworkVariants, type TemplateVariant } from './variant';

interface WizardResult {
  name: string;
  preset: TemplateVariant['name'];
  start: boolean;
  overwrite: boolean;
}

function isEmpty(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) {
    return true;
  }
  const files = fs.readdirSync(dirPath);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function formatTargetDir(targetDir: string): string {
  return targetDir.trim().replace(/\/+$/g, '');
}

export async function runWizard(): Promise<WizardResult> {
  _console.log('');
  _console.box({
    title: styleText('cyan', 'Create Vitto'),
    message: 'Welcome to Vitto project scaffolder!',
    style: {
      padding: 1,
      borderColor: 'cyan',
    },
  });

  // Prompt for project name
  const projectName = await _console.prompt('Project name:', {
    type: 'text',
    placeholder: 'my-website',
    default: 'my-website',
  });

  if (!projectName || typeof projectName !== 'string') {
    _console.error('Project name is required!');
    process.exit(1);
  }

  const cwd = process.cwd();
  const targetDir = formatTargetDir(projectName);
  const root = path.resolve(cwd, targetDir);

  // Check if directory exists and is not empty
  let overwrite = false;
  if (fs.existsSync(root) && !isEmpty(root)) {
    const relativePath = path.relative(cwd, root) || '.';
    _console.warn(
      `\nDirectory ${styleText('yellow', relativePath)} already exists and is not empty.`
    );

    const shouldOverwrite = await _console.prompt(
      'Do you want to overwrite the existing directory?',
      {
        type: 'confirm',
        initial: false,
      }
    );

    if (!shouldOverwrite) {
      _console.info('Operation cancelled.');
      process.exit(0);
    }

    overwrite = true;
  }

  // Prompt for template selection
  const templateChoices = frameworkVariants.map((variant) => ({
    label: variant.display,
    value: variant.name,
    hint: variant.name,
  }));

  const selectedTemplate = await _console.prompt('Select a template:', {
    type: 'select',
    options: templateChoices,
  });

  if (!selectedTemplate || typeof selectedTemplate !== 'string') {
    _console.error('Template selection is required!');
    process.exit(1);
  }

  // Prompt for start option
  const shouldStart = await _console.prompt(
    'Install dependencies and start dev server immediately?',
    {
      type: 'confirm',
      initial: false,
    }
  );

  return {
    name: projectName,
    preset: selectedTemplate as TemplateVariant['name'],
    start: Boolean(shouldStart),
    overwrite,
  };
}
