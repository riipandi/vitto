import fs from 'node:fs';
import path from 'node:path';

import { defineHooks } from 'vitto';

import type { ChangelogEntry } from '../../types/changelog';
import { createMarkdownRenderer } from '../markdown';

const CHANGELOG_DIR = path.resolve(import.meta.dirname, '../../content/changelogs');
const md = createMarkdownRenderer();

function parseChangelogFile(filePath: string): ChangelogEntry | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const slug = path.basename(filePath, '.md');

    // Parse frontmatter (--- delimited)
    const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    const meta: Record<string, string> = {};
    if (fmMatch) {
      for (const line of fmMatch[1].split('\n')) {
        const sep = line.indexOf(':');
        if (sep === -1) continue;
        meta[line.slice(0, sep).trim()] = line
          .slice(sep + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '');
      }
    }

    const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
    const content = md.render(body);

    const version = meta.version || slug;
    const title = meta.title || version;
    const date = meta.date || '';

    return {
      slug,
      version,
      date,
      title,
      description: meta.description || '',
      content,
      body,
    };
  } catch {
    return null;
  }
}

function getAllChangelogs(): ChangelogEntry[] {
  if (!fs.existsSync(CHANGELOG_DIR)) return [];
  return fs
    .readdirSync(CHANGELOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseChangelogFile(path.join(CHANGELOG_DIR, f)))
    .filter((e): e is ChangelogEntry => e !== null)
    .toSorted((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      if (isNaN(aTime) && isNaN(bTime)) return 0;
      if (isNaN(aTime)) return 1;
      if (isNaN(bTime)) return -1;
      if (aTime !== bTime) return bTime - aTime;
      // Same date — sort by version descending
      const aParts = a.version.split('.').map(Number);
      const bParts = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const diff = (bParts[i] || 0) - (aParts[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
}

export default defineHooks('changelogs', async (params?: { slug?: string }) => {
  const all = getAllChangelogs();

  if (params?.slug) {
    const idx = all.findIndex((e) => e.slug === params.slug);
    if (idx === -1) return null;

    const prev: ChangelogEntry['prev'] | null =
      idx < all.length - 1
        ? { slug: all[idx + 1].slug, title: all[idx + 1].title, version: all[idx + 1].version }
        : null;
    const next: ChangelogEntry['next'] | null =
      idx > 0
        ? { slug: all[idx - 1].slug, title: all[idx - 1].title, version: all[idx - 1].version }
        : null;

    return { ...all[idx], prev, next, all: getAllChangelogs() };
  }

  return all;
});
