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
const B = (s) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const CYAN = (s) => `\x1b[36m${s}\x1b[0m`;
const BOLD_CYAN = (s) => `\x1b[1;36m${s}\x1b[0m`;

function tag(name) {
  return DIM(`[${name}]`);
}
const BLANK = '';

function ok(p, t, msg) {
  console.log(`  ${GREEN('✔')} ${p} ${t} ${msg}`);
}
function fail(p, t, msg) {
  console.log(`  ${RED('✘')} ${p} ${t} ${msg}`);
}
function info(p, t, msg) {
  console.log(`  ${CYAN('~')} ${p} ${t} ${msg}`);
}
function dim(msg) {
  console.log(`    ${DIM(msg)}`);
}
function section(title) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(` ${BOLD_CYAN(title)}`);
  console.log(`${'─'.repeat(50)}`);
}

function run(cmd, cwd, _label) {
  const start = Date.now();
  try {
    const out = execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    return { ok: true, out: out.trim(), ms: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      out: e.stdout?.trim() || '',
      err: e.stderr?.trim() || e.message,
      ms: Date.now() - start,
    };
  }
}

function elapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Discover templates
// ---------------------------------------------------------------------------
function getTemplates() {
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
// Scaffold / Install / Build
// ---------------------------------------------------------------------------
function scaffold(template, dest) {
  return run(
    `node "${CLI_ENTRY}" "${basename(dest)}" --preset ${template} --overwrite`,
    join(dest, '..'),
    `scaffold ${template}`
  );
}
function install(dest) {
  return run('npm install --loglevel=error 2>&1', dest, 'install');
}
function build(dest) {
  return run('npm run build 2>&1', dest, 'build');
}

// ---------------------------------------------------------------------------
// Test a single template
// ---------------------------------------------------------------------------
function testTemplate(template, skipInstall) {
  const dest = join(TEST_DIR, template);
  const t = tag(template);
  const phases = [];

  // ── Phase 1: Scaffold ──────────────────────────────────────
  info(BLANK, t, 'Scaffolding');
  let r = scaffold(template, dest);
  if (!r.ok) {
    fail(BLANK, t, 'scaffold failed');
    dim(r.err?.split('\n').slice(0, 3).join('\n'));
    phases.push({ phase: 'scaffold', ok: false });
    return { template, phases, buildOk: false };
  }
  ok(BLANK, t, `scaffolded ${DIM(`(${elapsed(r.ms)})`)}`);
  phases.push({ phase: 'scaffold', ok: true, ms: r.ms });

  // ── Phase 2: Install ────────────────────────────────────────
  if (!skipInstall) {
    info(BLANK, t, 'Installing dependencies');
    r = install(dest);
    if (!r.ok) {
      fail(BLANK, t, 'install failed');
      dim(r.err?.split('\n').slice(0, 3).join('\n'));
      phases.push({ phase: 'install', ok: false });
      return { template, phases, buildOk: false };
    }
    ok(BLANK, t, `installed ${DIM(`(${elapsed(r.ms)})`)}`);
    phases.push({ phase: 'install', ok: true, ms: r.ms });
  }

  // ── Phase 3: Build ─────────────────────────────────────────
  info(BLANK, t, 'Building');
  r = build(dest);
  if (!r.ok) {
    const errors = (r.out + '\n' + (r.err || ''))
      .split('\n')
      .filter((l) => /error|Error|ERR|FAIL/i.test(l));
    fail(BLANK, t, `build failed ${DIM(`(${elapsed(r.ms)})`)}`);
    errors.slice(0, 5).forEach((e) => dim(e.trim()));
    phases.push({ phase: 'build', ok: false, ms: r.ms });
    return { template, phases, buildOk: false };
  }
  ok(BLANK, t, `built ${DIM(`(${elapsed(r.ms)})`)}`);
  phases.push({ phase: 'build', ok: true, ms: r.ms });

  // ── Check dist output ───────────────────────────────────────
  const distDir = join(dest, 'dist');
  if (!existsSync(distDir)) {
    fail(BLANK, t, 'dist/ not found');
    return { template, phases, buildOk: true, routesOk: false, missing: ['dist/'] };
  }

  const routes = ['/index.html', '/404.html'];
  if (template === 'blog') {
    routes.push('/blog.html', '/blog/qui-est-esse.html', '/about.html');
  } else if (template === 'full') {
    routes.push(
      '/blog.html',
      '/blog/hello-world.html',
      '/docs.html',
      '/docs/getting-started/overview.html',
      '/about.html',
      '/changelog.html'
    );
  } else {
    routes.push('/about.html');
  }

  const checks = checkRoutes(distDir, routes);
  const failed = checks.filter((c) => !c.ok);

  if (failed.length > 0) {
    fail(BLANK, t, `${failed.length} route(s) missing:`);
    failed.forEach((f) => dim(`  ${f.route}`));
    return {
      template,
      phases,
      buildOk: true,
      routesOk: false,
      missing: failed.map((f) => f.route),
    };
  }

  checks.forEach((c) => ok(BLANK, t, `${c.route} ${DIM(`(${(c.size / 1024).toFixed(1)} KB)`)}`));
  return { template, phases, buildOk: true, routesOk: true, pages: checks.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const filter = args.find((a) => !a.startsWith('--'));
  const skipInstall = args.includes('--skip-install');

  const startTime = Date.now();

  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });

  section('Pre-build vitto-plugin');
  const pluginDir = join(PACKAGES_DIR, 'vitto-plugin');
  if (existsSync(join(pluginDir, 'dist'))) {
    info(BLANK, tag('skip'), 'vitto-plugin already built');
  } else {
    info(BLANK, tag('build'), 'Building vitto-plugin...');
    const r = run('npm run build 2>&1', pluginDir, 'build vitto-plugin');
    if (!r.ok) {
      fail(BLANK, tag('build'), 'failed — cannot continue');
      process.exit(1);
    }
    ok(BLANK, tag('build'), `vitto-plugin built ${DIM(`(${elapsed(r.ms)})`)}`);
  }

  const allTemplates = getTemplates();
  const templates = filter ? allTemplates.filter((t) => t === filter) : allTemplates;

  if (templates.length === 0) {
    fail(BLANK, tag('error'), `"${filter}" not found. Available: ${allTemplates.join(', ')}`);
    process.exit(1);
  }

  section(`Testing ${templates.length} template(s)`);
  templates.forEach((t) => console.log(`   ${DIM('·')} ${t}`));

  const results = [];
  for (let i = 0; i < templates.length; i++) {
    const tmpl = templates[i];
    console.log('');
    const r = testTemplate(tmpl, skipInstall);
    if (r) results.push(r);
  }

  // ── Summary Dashboard ───────────────────────────────────────
  const elapsedTotal = Date.now() - startTime;
  section('Results Summary');

  const hdr = (s) => `\x1b[1;37m${s.padEnd(10)}\x1b[0m`;
  const sep = DIM('─'.repeat(10) + ' ─' + '─'.repeat(8) + ' ─' + '─'.repeat(20));
  console.log(`  ${hdr('Template')}  ${hdr('Build')}  ${hdr('Routes')}`);
  console.log(`  ${sep}`);

  let passed = 0,
    failed = 0;
  for (const r of results) {
    const name = `\x1b[1m${r.template.padEnd(10)}\x1b[0m`;
    const buildStatus = r.buildOk ? GREEN('  ✓  ') : RED('  ✘  ');
    const routesStatus = r.routesOk ? GREEN('✓') : r.buildOk ? RED('✘') : DIM('—');
    const routesDetail = r.routesOk
      ? DIM(`${r.pages} pages`)
      : r.missing
        ? DIM(`missing: ${r.missing.join(',')}`)
        : '';

    console.log(`  ${name} ${buildStatus}   ${routesStatus} ${routesDetail}`);
    if (r.buildOk && r.routesOk) passed++;
    else failed++;
  }

  console.log(`  ${sep}`);
  const totalTime = elapsed(elapsedTotal);
  const summary = `${results.length} total · ${GREEN(`${passed} passed`)} · ${failed > 0 ? RED(`${failed} failed`) : '0 failed'} · ${DIM(totalTime)}`;
  console.log(`  ${B(summary)}`);
  console.log('');

  if (failed === 0) {
    info(BLANK, tag('clean'), 'All tests passed — cleaning up...');
    rmSync(TEST_DIR, { recursive: true });
  } else {
    info(BLANK, tag('info'), `Test artifacts left at ${TEST_DIR} for inspection`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
