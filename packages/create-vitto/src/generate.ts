import type { SpawnOptions } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';

import spawn from 'cross-spawn';

import _console from './logger';
import { frameworkVariants, type TemplateVariant } from './variant';

interface ProjectOptions {
  name: string;
  preset?: TemplateVariant['name'];
  overwrite?: boolean;
  start?: boolean;
  packageManager?: string;
}

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
  _gitkeep: '.gitkeep',
};

function run(commandWithArgs: string[], options: SpawnOptions = {}) {
  const [command, ...args] = commandWithArgs;

  if (!command) {
    _console.error('No command provided');
    process.exit(1);
  }

  const { status, error } = spawn.sync(command, args, options);
  if (status != null && status > 0) {
    process.exit(status);
  }

  if (error) {
    _console.error(`\n${command} ${args.join(' ')} error!`);
    console.error(error);
    process.exit(1);
  }
}

function install(root: string, agent: string) {
  if (process.env._VITE_TEST_CLI) {
    _console.log(`Installing dependencies with ${agent}... (skipped in test)`);
    return;
  }

  _console.log(`Installing dependencies with ${agent}...`);

  run(getInstallCommand(agent, root), {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, CI: 'true' },
  });

  _console.log('Dependencies installed!');
}

function start(root: string, agent: string) {
  if (process.env._VITE_TEST_CLI) {
    _console.log('Starting dev server... (skipped in test)');
    return;
  }

  _console.log('Starting dev server...');
  run(getRunCommand(agent, 'dev'), {
    stdio: 'inherit',
    cwd: root,
  });
}

function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '');
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, renameFiles[file] ?? file);
    copy(srcFile, destFile);
  }
}

function isEmpty(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

function getInstallCommand(agent: string, root: string): string[] {
  if (agent === 'yarn') {
    return [agent];
  }

  const cmd = [agent, 'install'];

  if (agent === 'pnpm') {
    // Inside pnpm workspace? Ignore it so pnpm reads the project-local config
    if (isInsidePnpmWorkspace(root)) {
      cmd.push('--ignore-workspace');
    }
    // Write allowBuilds config so build scripts actually run, not just ignored
    // pnpm v11 ignores package.json#pnpm — must use pnpm-workspace.yaml
    const wsYaml = path.join(root, 'pnpm-workspace.yaml');
    if (!fs.existsSync(wsYaml)) {
      fs.writeFileSync(wsYaml, "# pnpm workspace config\nallowBuilds:\n  '*': true\n", 'utf-8');
    }
  }

  return cmd;
}

function isInsidePnpmWorkspace(root: string): boolean {
  let dir = path.dirname(root);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return true;
    dir = path.dirname(dir);
  }
  return false;
}

function getRunCommand(agent: string, script: string): string[] {
  switch (agent) {
    case 'yarn':
    case 'pnpm':
    case 'bun':
      return [agent, script];
    case 'deno':
      return [agent, 'task', script];
    default:
      return [agent, 'run', script];
  }
}

export default async function generateProject(opts: ProjectOptions) {
  const cwd = process.cwd();
  const targetDir = formatTargetDir(opts.name);
  const templateName = opts.preset || 'basic';

  const variant = frameworkVariants.find((v) => v.name === templateName);
  if (!variant) {
    _console.error(`Preset "${templateName}" not found!`);
    _console.log('\nAvailable templates:');
    frameworkVariants.forEach((v) => {
      _console.log(`  ${v.color(v.name.padEnd(15))} - ${v.display}`);
    });
    process.exit(1);
  }

  const root = path.resolve(cwd, targetDir);

  if (fs.existsSync(root) && !isEmpty(root)) {
    if (opts.overwrite) {
      emptyDir(root);
      const relativePath = path.relative(cwd, root) || '.';
      _console.warn(`Emptied directory: ${relativePath}`);
    } else {
      const relativePath = path.relative(cwd, root) || '.';
      _console.error(`Directory ${relativePath} is not empty. Use --overwrite to overwrite.`);
      process.exit(1);
    }
  }

  let packageName = path.basename(root);
  if (!isValidPackageName(packageName)) {
    packageName = toValidPackageName(packageName);
    _console.warn(`Package name converted to: ${packageName}`);
  }

  fs.mkdirSync(root, { recursive: true });

  const relativePath = path.relative(cwd, root) || '.';
  _console.log(`\nScaffolding project in ${styleText('cyan', relativePath)}...`);

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..' /* go up from `dist` to package root */,
    `template-${variant.name}`
  );

  if (!fs.existsSync(templateDir)) {
    _console.error(`Template ${variant.name} not found!`);
    process.exit(1);
  }

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else if (file === 'index.html') {
      const templatePath = path.join(templateDir, file);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const updatedContent = templateContent.replace(
        /<title>.*?<\/title>/,
        `<title>${packageName}</title>`
      );
      fs.writeFileSync(targetPath, updatedContent);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'));

  pkg.name = packageName;
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

  _console.log('Project scaffolded successfully!\n');

  const pkgManager = opts.packageManager || 'pnpm';

  if (opts.start) {
    install(root, pkgManager);
    start(root, pkgManager);
  } else {
    const cdProjectName = path.relative(cwd, root);

    _console.log('Done! Now run:\n');

    if (cdProjectName) {
      _console.log(
        `  ${styleText('cyan', `cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`)}`
      );
    }
    _console.log(`  ${styleText('cyan', getInstallCommand(pkgManager, root).join(' '))}`);
    _console.log(`  ${styleText('cyan', getRunCommand(pkgManager, 'dev').join(' '))}`);
    _console.log('');
  }
}
