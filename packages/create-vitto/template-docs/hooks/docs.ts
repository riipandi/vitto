import fs from 'node:fs';
import path from 'node:path';

import { alert } from '@mdit/plugin-alert';
import { anchor } from '@mdit/plugin-anchor';
import { tab } from '@mdit/plugin-tab';
import { tasklist } from '@mdit/plugin-tasklist';
import MarkdownIt from 'markdown-it';
import { defineHooks } from 'vitto';

interface DocItem {
  slug: string;
  title: string;
  description: string;
  content: string;
  order: number;
  section: string;
  sectionLabel: string;
}

interface DocSection {
  id: string;
  label: string;
  items: { slug: string; title: string; order: number }[];
}

const CONTENT_DIR = path.resolve(import.meta.dirname, '../content/docs');

const SECTIONS: { id: string; label: string; order: number }[] = [
  { id: 'getting-started', label: 'Getting Started', order: 1 },
];

// Create markdown-it renderer with basic plugins
const md = MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(anchor, { level: [2, 3, 4] });
md.use(alert);
md.use(tab, { name: 'tabs' });
md.use(tasklist, { disabled: true, label: true });

// Override fence renderer for basic styling
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

function getAllDocs(): DocItem[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const docs: DocItem[] = [];
  for (const section of SECTIONS) {
    const sectionDir = path.join(CONTENT_DIR, section.id);
    if (!fs.existsSync(sectionDir)) continue;
    const files = fs.readdirSync(sectionDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const doc = parseDocFile(path.join(sectionDir, file), section.id, section.label);
      if (doc) docs.push(doc);
    }
  }
  return docs;
}

function parseDocFile(filePath: string, sectionId: string, sectionLabel: string): DocItem | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    const slug = `${sectionId}/${fileName}`;
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || fileName;
    const descMatch = raw.replace(/^#.+$/m, '').match(/\n\n(.+?)(?:\n\n|$)/);
    const description = descMatch?.[1]?.trim() || '';
    const content = md.render(raw);
    const orderMatch = fileName.match(/^(\d+)/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 99;
    return { slug, title, description, content, order, section: sectionId, sectionLabel };
  } catch {
    return null;
  }
}

function getDocBySlug(slug: string): DocItem | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const parts = slug.split('/');
  const sectionId = parts[0] || '';
  const section = SECTIONS.find((s) => s.id === sectionId);
  return parseDocFile(filePath, sectionId, section?.label || '');
}

const SECTION_ITEMS_ORDER: Record<string, string[]> = {
  'getting-started': ['introduction', 'installation'],
};

function getSections(): DocSection[] {
  const allDocs = getAllDocs();
  return SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    items: allDocs
      .filter((d) => d.section === s.id)
      .toSorted((a, b) => {
        const order = SECTION_ITEMS_ORDER[s.id] ?? [];
        return order.indexOf(a.slug.split('/')[1]) - order.indexOf(b.slug.split('/')[1]);
      })
      .map((d) => ({ slug: d.slug, title: d.title, order: d.order })),
  }));
}

export default defineHooks('docs', async (params?: { slug?: string }) => {
  if (params?.slug) {
    const doc = getDocBySlug(params.slug);
    if (!doc) return null;
    const sections = getSections();
    const flatNav = sections.flatMap((s) =>
      s.items.map((item) => ({ ...item, sectionLabel: s.label }))
    );
    const idx = flatNav.findIndex((item) => item.slug === doc.slug);
    return {
      ...doc,
      sections,
      prev: idx > 0 ? flatNav[idx - 1] : null,
      next: idx >= 0 && idx < flatNav.length - 1 ? flatNav[idx + 1] : null,
    };
  }
  return getAllDocs();
});

export const docsIndex = defineHooks('docsIndex', async () => {
  return { sections: getSections() };
});
