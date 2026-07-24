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

const CONTENT_DIR = path.resolve(import.meta.dirname, '../../content/docs');

// Section definitions — folder name = section id, order defines display order
export const SECTIONS: { id: string; label: string; order: number }[] = [
  { id: 'getting-started', label: 'Getting Started', order: 1 },
  { id: 'core', label: 'Core Concepts', order: 2 },
  { id: 'features', label: 'Features', order: 3 },
  { id: 'guides', label: 'Guides', order: 4 },
  { id: 'reference', label: 'Reference', order: 5 },
];

// Create markdown-it with Shiki syntax highlighting
const md = MarkdownIt({ html: true, linkify: true, typographer: true });
useShiki(md);

// Strip YAML front matter — callback receives raw meta string
md.use(frontMatter, (_meta: string) => {
  // Front matter is stripped from rendered output automatically
  // Parsed YAML can be used here in the future for metadata
});

md.use(anchor, { level: [2, 3, 4] });
md.use(alert);
md.use(tab, { name: 'tabs' });
md.use(tasklist, { disabled: true, label: true });

// ans: tasklist `disabled: true` keeps checkboxes read-only.

// Override fence renderer — wrap Shiki output in container with copy button
const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info === 'vento') token.info = 'html';

  let codeHtml;
  try {
    codeHtml = defaultFence(tokens, idx, options, env, self);
  } catch {
    const escaped = md.utils.escapeHtml(token.content);
    codeHtml = `<pre class="shiki shiki-themes github-light github-dark" tabindex="0" style="background-color:#fff;color:#24292e;--shiki-dark-bg:#24292e;--shiki-dark:#e1e4e8"><code>${escaped}</code></pre>`;
  }

  const lang = token.info || 'code';
  const encoded = Buffer.from(token.content).toString('base64');

  // Prepend .code-pre to existing class attribute
  const injected = codeHtml.replace(/(<pre\s+class=")/, '$1code-pre ');

  return `<div class="code-block group" style="--cb-bg:#fff;--shiki-dark-bg:#24292e;--shiki-dark:#e1e4e8">
    <div class="code-block-header">
      <span class="code-lang">${lang}</span>
      <button type="button" class="copy-btn" data-code="${encoded}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span class="copy-label">Copy</span>
      </button>
    </div>
    ${injected}
  </div>`;
};

/**
 * Scan content directory recursively and return all doc items.
 * Folder structure: content/{category}/{slug}.md
 * Slug = "category/slug" (e.g. "getting-started/introduction")
 */
function getAllDocs(): DocItem[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const docs: DocItem[] = [];

  for (const section of SECTIONS) {
    const sectionDir = path.join(CONTENT_DIR, section.id);
    if (!fs.existsSync(sectionDir)) continue;

    const files = fs.readdirSync(sectionDir).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(sectionDir, file);
      const doc = parseDocFile(filePath, section.id, section.label);
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

    // Extract first heading as title
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || fileName;

    // Extract description (first paragraph after title)
    const descMatch = raw.replace(/^#.+$/m, '').match(/\n\n(.+?)(?:\n\n|$)/);
    const description = descMatch?.[1]?.trim() || '';

    // Convert markdown to HTML with Shiki highlighting (synchronous)
    const content = md.render(raw);

    // Extract order number from filename (optional prefix like "01-")
    const orderMatch = fileName.match(/^(\d+)/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 99;

    return {
      slug,
      title,
      description,
      content,
      order,
      section: sectionId,
      sectionLabel,
    };
  } catch {
    return null;
  }
}

function getDocBySlug(slug: string): DocItem | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  // Determine section from slug path
  const parts = slug.split('/');
  const sectionId = parts[0] || '';
  const section = SECTIONS.find((s) => s.id === sectionId);
  return parseDocFile(filePath, sectionId, section?.label || '');
}

const SECTION_ITEMS_ORDER: Record<string, string[]> = {
  'getting-started': ['introduction', 'installation', 'configuration'],
  core: ['templating', 'dynamic-routes', 'hooks'],
  features: ['search', 'deployment', 'performance'],
  guides: ['examples', 'contributing'],
  reference: ['api-reference', 'troubleshooting', 'comparison'],
};

function getSections(): DocSection[] {
  const allDocs = getAllDocs();
  return SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    items: allDocs
      .filter((d: DocItem) => d.section === s.id)
      .toSorted((a: DocItem, b: DocItem) => {
        const order = SECTION_ITEMS_ORDER[s.id] ?? [];
        return order.indexOf(a.slug.split('/')[1]) - order.indexOf(b.slug.split('/')[1]);
      })
      .map((d: DocItem) => ({ slug: d.slug, title: d.title, order: d.order })),
  }));
}

// Hook for dynamic routes — returns array of docs, or single doc with nav
export default defineHooks('docs', async (params?: { slug?: string }) => {
  if (params?.slug) {
    const doc = getDocBySlug(params.slug);
    if (!doc) return null;

    const sections = getSections();
    // Flatten all items into navigation order
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

// Hook for docs index page — returns sections with docs
export const docsIndex = defineHooks('docsIndex', async () => {
  return { sections: getSections() };
});
