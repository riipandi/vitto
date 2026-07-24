import fs from 'node:fs';
import path from 'node:path';

import slugify from 'slugify';
import { defineHooks } from 'vitto';

import { createMarkdownRenderer } from '../markdown';
import type { BlogPost } from '../../types/blog';

const BLOG_DIR = path.resolve(import.meta.dirname, '../../content/blog');
const md = createMarkdownRenderer();

function parseFrontmatter(raw: string): Record<string, any> {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  const meta: Record<string, any> = {};
  if (!fmMatch) return meta;
  for (const line of fmMatch[1].split('\n')) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let val: any = line.slice(sep + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      val = val.replace(/^['"]|['"]$/g, '');
    }
    meta[key] = val;
  }
  return meta;
}

function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true });
}

function parseBlogFile(filePath: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    const meta = parseFrontmatter(raw);

    const body = raw.startsWith('---\n') ? raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '') : raw;
    const content = md.render(body);

    const title = meta.title || fileName;
    const slug = meta.slug || toSlug(title);
    const created = meta.created || '';
    const dateDisplay = created.split('T')[0] || created;

    return {
      slug,
      title,
      description: meta.description || '',
      tags: meta.tags || [],
      author: meta.author || '',
      created,
      updated: meta.updated || '',
      dateDisplay,
      content,
      body,
    };
  } catch {
    return null;
  }
}

function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseBlogFile(path.join(BLOG_DIR, f)))
    .filter((p): p is BlogPost => p !== null)
    .toSorted((a, b) => {
      const aTime = new Date(a.created).getTime();
      const bTime = new Date(b.created).getTime();
      if (isNaN(aTime) && isNaN(bTime)) return 0;
      if (isNaN(aTime)) return 1;
      if (isNaN(bTime)) return -1;
      return bTime - aTime;
    })
    .map((p, i) => ({ ...p, id: i + 1 }));
}

const slugMap = new Map<string, BlogPost>();

export default defineHooks('posts', async (params) => {
  const all = getAllPosts();
  if (slugMap.size === 0) {
    for (const p of all) slugMap.set(p.slug, p);
  }
  if (params?.slug) {
    return slugMap.get(params.slug) || null;
  }
  return all;
});
