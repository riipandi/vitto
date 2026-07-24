/**
 * Template Test Runner — scaffolds, builds & validates every create-vitto template.
 *
 * Usage:
 *   node scripts/test-templates.mjs                  # test all templates
 *   node scripts/test-templates.mjs blog             # test only "blog"
 *   node scripts/test-templates.mjs --skip-install   # skip npm install (use cached)
 */

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');
const CLI_ENTRY = join(PACKAGES_DIR, 'create-vitto', 'bin', 'create-vitto.mjs');
const TEST_DIR = join(ROOT, '.test-templates');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(label, msg, color = '') {
  const prefix = color ? `\x1b[${color}m${label}\x1b[0m` : label;
  console.log(`${prefix} ${msg}`);
}

function ok(msg) {
  log('  ✔', msg, '32');
}
function fail(msg) {
  log('  ✘', msg, '31');
}
function info(msg) {
  log('  ~', msg, '36');
}
function title(t) {
  console.log(`\n\x1b[1;34m${t}\x1b[0m\n`);
}

function run(cmd, cwd, _label) {
  try {
    const out = execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: e.stdout?.trim() || '', err: e.stderr?.trim() || e.message };
  }
}

// ---------------------------------------------------------------------------
// Discover templates
// ---------------------------------------------------------------------------
function getTemplates() {
  // Parse available templates from CLI --help or --templates output
  const out = execSync(`node "${CLI_ENTRY}" --templates`, { encoding: 'utf8' });
  const lines = out.split('\n');
  const templates = [];
  for (const line of lines) {
    const m = line.match(/^\s{2}(\S+)\s+-/);
    if (m) templates.push(m[1]);
  }
  return templates;
}

// ---------------------------------------------------------------------------
// HTTP server helper
// ---------------------------------------------------------------------------
function checkRoutes(distDir, routes) {
  const results = [];
  for (const route of routes) {
    const filePath = join(distDir, route.replace(/^\//, ''));
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      results.push({ route, ok: true, size: content.length });
    } else {
      results.push({ route, ok: false });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Scaffold a template
// ---------------------------------------------------------------------------
function scaffold(template, dest) {
  return run(
    `node "${CLI_ENTRY}" "${basename(dest)}" --preset ${template} --overwrite`,
    join(dest, '..'),
    `scaffold ${template}`
  );
}

// ---------------------------------------------------------------------------
// Install dependencies
// ---------------------------------------------------------------------------
function install(dest) {
  return run('npm install --loglevel=error 2>&1', dest, 'install');
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
function build(dest) {
  return run('npm run build 2>&1', dest, 'build');
}

// ---------------------------------------------------------------------------
// Test a single template
// ---------------------------------------------------------------------------
function testTemplate(template, skipInstall) {
  const dest = join(TEST_DIR, template);
  const label = `[${template}]`;

  info(`${label} scaffolding...`);
  let r = scaffold(template, dest);
  if (!r.ok) {
    fail(`${label} scaffold failed: ${r.err}`);
    return null;
  }
  ok(`${label} scaffolded`);

  if (!skipInstall) {
    info(`${label} installing dependencies...`);
    r = install(dest);
    if (!r.ok) {
      fail(`${label} install failed: ${r.err}`);
      return null;
    }
    ok(`${label} installed`);
  }

  info(`${label} building...`);
  r = build(dest);
  if (!r.ok) {
    // Capture specific errors
    const errors = (r.out + '\n' + (r.err || ''))
      .split('\n')
      .filter((l) => /error|Error|ERR|FAIL/i.test(l));
    fail(`${label} build failed`);
    errors.slice(0, 5).forEach((e) => console.log(`       ${e.trim()}`));
    return { template, buildOk: false, errors };
  }
  ok(`${label} built`);

  // Check dist output
  const distDir = join(dest, 'dist');
  if (!existsSync(distDir)) {
    fail(`${label} dist/ not found`);
    return { template, buildOk: false, errors: ['dist/ not found'] };
  }

  // Verify expected routes
  const routes = ['/index.html', '/404.html'];
  if (template === 'blog') {
    routes.push('/blog/index.html', '/blog/post-1.html', '/about.html');
  } else if (template === 'full') {
    routes.push(
      '/blog/index.html',
      '/blog/hello-world.html',
      '/docs.html',
      '/docs/getting-started/introduction.html',
      '/about.html',
      '/changelog.html'
    );
  } else {
    routes.push('/about.html');
  }

  const checks = checkRoutes(distDir, routes);
  const failed = checks.filter((c) => !c.ok);

  if (failed.length > 0) {
    fail(`${label} ${failed.length} route(s) missing:`);
    failed.forEach((f) => console.log(`         ${f.route}`));
    return { template, buildOk: true, routesOk: false, missing: failed.map((f) => f.route) };
  }

  checks.forEach((c) => ok(`${label} ${c.route} (${(c.size / 1024).toFixed(1)} KB)`));
  return { template, buildOk: true, routesOk: true, pages: checks.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const filter = args.find((a) => !a.startsWith('--'));
  const skipInstall = args.includes('--skip-install');

  // Clean & create test dir
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });

  // Auto-build the vitto-plugin first
  title('Pre-build vitto-plugin');
  const pluginDir = join(PACKAGES_DIR, 'vitto-plugin');
  if (existsSync(join(pluginDir, 'dist'))) {
    info('vitto-plugin already built');
  } else {
    const r = run('npm run build 2>&1', pluginDir, 'build vitto-plugin');
    if (!r.ok) {
      fail('vitto-plugin build failed — cannot continue');
      process.exit(1);
    }
    ok('vitto-plugin built');
  }

  // Discover templates
  const allTemplates = getTemplates();
  const templates = filter ? allTemplates.filter((t) => t === filter) : allTemplates;

  if (templates.length === 0) {
    fail(`Template "${filter}" not found. Available: ${allTemplates.join(', ')}`);
    process.exit(1);
  }

  title(`Testing ${templates.length} template(s): ${templates.join(', ')}`);

  const results = [];
  for (const tmpl of templates) {
    const r = testTemplate(tmpl, skipInstall);
    if (r) results.push(r);
  }

  // Summary
  title('Results');

  let passed = 0,
    failed = 0;
  for (const r of results) {
    if (r.buildOk && r.routesOk) {
      ok(`${r.template}: build ✓, ${r.pages} routes ✓`);
      passed++;
    } else if (r.buildOk) {
      fail(`${r.template}: build ✓, routes ✘ (missing: ${r.missing?.join(', ')})`);
      failed++;
    } else {
      fail(`${r.template}: build ✘`);
      failed++;
    }
  }

  console.log(`\n\x1b[1m${passed + failed} total · ${passed} passed · ${failed} failed\x1b[0m`);

  // Cleanup
  if (failed === 0) {
    info('All tests passed — cleaning up...');
    rmSync(TEST_DIR, { recursive: true });
  } else {
    info(`Test artifacts left at ${TEST_DIR} for inspection`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
