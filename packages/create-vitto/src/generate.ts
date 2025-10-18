import type { SpawnOptions } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import spawn from 'cross-spawn'
import { Spinner } from 'picospinner'
import _console from './logger'
import { frameworkVariants, type TemplateVariant } from './variant'

interface ProjectOptions {
  name: string
  preset?: TemplateVariant['name']
  overwrite?: boolean
  immediate?: boolean
}

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
  _gitkeep: '.gitkeep',
}

function run(commandWithArgs: string[], options: SpawnOptions = {}) {
  const [command, ...args] = commandWithArgs

  if (!command) {
    _console.error('No command provided')
    process.exit(1)
  }

  const { status, error } = spawn.sync(command, args, options)
  if (status != null && status > 0) {
    process.exit(status)
  }

  if (error) {
    _console.error(`\n${command} ${args.join(' ')} error!`)
    console.error(error)
    process.exit(1)
  }
}

function install(root: string, agent: string) {
  if (process.env._VITE_TEST_CLI) {
    _console.log(`Installing dependencies with ${agent}... (skipped in test)`)
    return
  }

  const spinner = new Spinner(`Installing dependencies with ${agent}`)
  spinner.start()

  run(getInstallCommand(agent), {
    stdio: 'inherit',
    cwd: root,
  })

  spinner.stop()
  _console.log('Dependencies installed!')
}

function start(root: string, agent: string) {
  if (process.env._VITE_TEST_CLI) {
    _console.log('Starting dev server... (skipped in test)')
    return
  }

  _console.log('Starting dev server...')
  run(getRunCommand(agent, 'dev'), {
    stdio: 'inherit',
    cwd: root,
  })
}

function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '')
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName)
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, renameFiles[file] ?? file)
    copy(srcFile, destFile)
  }
}

function isEmpty(dirPath: string) {
  const files = fs.readdirSync(dirPath)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

interface PkgInfo {
  name: string
  version: string
}

function pkgFromUserAgent(userAgent: string | undefined): PkgInfo | undefined {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  if (!pkgSpec) return undefined
  const pkgSpecArr = pkgSpec.split('/')
  const name = pkgSpecArr[0]
  const version = pkgSpecArr[1]

  if (!name || !version) return undefined

  return {
    name,
    version,
  }
}

function getInstallCommand(agent: string): string[] {
  if (agent === 'yarn') {
    return [agent]
  }
  return [agent, 'install']
}

function getRunCommand(agent: string, script: string): string[] {
  switch (agent) {
    case 'yarn':
    case 'pnpm':
    case 'bun':
      return [agent, script]
    case 'deno':
      return [agent, 'task', script]
    default:
      return [agent, 'run', script]
  }
}

export default async function generateProject(opts: ProjectOptions) {
  const cwd = process.cwd()
  const targetDir = formatTargetDir(opts.name)
  const templateName = opts.preset || 'basic'

  const variant = frameworkVariants.find((v) => v.name === templateName)
  if (!variant) {
    _console.error(`Preset "${templateName}" not found!`)
    _console.log('\nAvailable templates:')
    frameworkVariants.forEach((v) => {
      _console.log(`  ${v.color(v.name.padEnd(15))} - ${v.display}`)
    })
    process.exit(1)
  }

  const root = path.resolve(cwd, targetDir)

  if (fs.existsSync(root) && !isEmpty(root)) {
    if (opts.overwrite) {
      emptyDir(root)
      const relativePath = path.relative(cwd, root) || '.'
      _console.warn(`Emptied directory: ${relativePath}`)
    } else {
      const relativePath = path.relative(cwd, root) || '.'
      _console.error(`Directory ${relativePath} is not empty. Use --overwrite to overwrite.`)
      process.exit(1)
    }
  }

  let packageName = path.basename(root)
  if (!isValidPackageName(packageName)) {
    packageName = toValidPackageName(packageName)
    _console.warn(`Package name converted to: ${packageName}`)
  }

  fs.mkdirSync(root, { recursive: true })

  const relativePath = path.relative(cwd, root) || '.'
  const spinner = new Spinner(`Scaffolding project in ${styleText('cyan', relativePath)}`)
  spinner.start()

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..' /* go up from `dist` to package root */,
    `template-${variant.name}`
  )

  if (!fs.existsSync(templateDir)) {
    spinner.stop()
    _console.error(`Template ${variant.name} not found!`)
    process.exit(1)
  }

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else if (file === 'index.html') {
      const templatePath = path.join(templateDir, file)
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      const updatedContent = templateContent.replace(
        /<title>.*?<\/title>/,
        `<title>${packageName}</title>`
      )
      fs.writeFileSync(targetPath, updatedContent)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'))

  pkg.name = packageName
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  spinner.stop()
  _console.log('Project scaffolded successfully!')

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  if (opts.immediate) {
    install(root, pkgManager)
    start(root, pkgManager)
  } else {
    const cdProjectName = path.relative(cwd, root)

    _console.log('')
    _console.log('Done! Now run:')
    _console.log('')

    if (cdProjectName) {
      _console.log(
        `  ${styleText('cyan', `cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`)}`
      )
    }
    _console.log(`  ${styleText('cyan', getInstallCommand(pkgManager).join(' '))}`)
    _console.log(`  ${styleText('cyan', getRunCommand(pkgManager, 'dev').join(' '))}`)
    _console.log('')
  }
}
