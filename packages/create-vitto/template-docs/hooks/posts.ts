import fs from 'node:fs';
import path from 'node:path';

import { alert } from '@mdit/plugin-alert';
import { anchor } from '@mdit/plugin-anchor';
import { tab } from '@mdit/plugin-tab';
import { tasklist } from '@mdit/plugin-tasklist';
import MarkdownIt from 'markdown-it';
import slugify from 'slugify';
import { defineHooks } from 'vitto';

const BLOG_DIR = path.resolve(import.meta.dirname, '../content/blog');

const md = MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(anchor, { level: [2, 3, 4] });
md.use(alert);
md.use(tab, { name: 'tabs' });
md.use(tasklist, { disabled: true, label: true });

const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  let codeHtml: string;
  try {
    codeHtml = defaultFence(tokens, idx, options, env, self);
  } catch {
    const escaped = md.utils.escapeHtml(token.content);
    codeHtml = `<pre class="code-block"><code>${escaped}</code></pre>`;
  }
  const lang = token.info || 'code';
  return `<div class="code-wrap"><div class="code-label">${lang}</div>${codeHtml}</div>`;
};

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  created: string;
  updated: string;
  dateDisplay: string;
  content: string;
  body: string;
}

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
      val = val
        .slice(1, -1)
        .split(',')
        .map((s: string) => s.trim().replace(/^['"]|['"]$/g, ''));
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
    const rawName = path.basename(filePath, '.md');
    const meta = parseFrontmatter(raw);
    const prefixMatch = rawName.match(/^(\d{4})-(.+)/);
    const fileName = prefixMatch ? prefixMatch[2] : rawName;
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
    });
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
