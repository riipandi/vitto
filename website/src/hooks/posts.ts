import fs from 'node:fs';
import path from 'node:path';

import { alert } from '@mdit/plugin-alert';
import { anchor } from '@mdit/plugin-anchor';
import { tab } from '@mdit/plugin-tab';
import { tasklist } from '@mdit/plugin-tasklist';
import MarkdownIt from 'markdown-it';
import frontMatter from 'markdown-it-front-matter';
import { defineHooks } from 'vitto';

import { useShiki } from '../shiki';

const BLOG_DIR = path.resolve(import.meta.dirname, '../../content/blog');

// Shared markdown-it instance for blog content
const md = MarkdownIt({ html: true, linkify: true, typographer: true });
useShiki(md);
md.use(frontMatter, () => {});
md.use(anchor, { level: [2, 3, 4] });
md.use(alert);
md.use(tab, { name: 'tabs' });
md.use(tasklist, { disabled: true, label: true });

// Alias vento → html for syntax highlighting
const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info === 'vento') token.info = 'html';
  return defaultFence(tokens, idx, options, env, self);
};

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  author: string;
  created: string;
  updated: string;
  content: string;
  body: string;
  id?: number;
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

function parseBlogFile(filePath: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    const meta = parseFrontmatter(raw);

    const body = raw.startsWith('---\n') ? raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '') : raw;
    const content = md.render(body);

    return {
      slug: meta.slug || fileName,
      title: meta.title || fileName,
      date: meta.date || '',
      description: meta.description || '',
      tags: meta.tags || [],
      author: meta.author || '',
      created: meta.created || meta.date || '',
      updated: meta.updated || '',
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
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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
