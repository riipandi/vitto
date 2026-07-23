import fs from 'node:fs';
import path from 'node:path';

import langBash from '@shikijs/langs/bash';
import langCss from '@shikijs/langs/css';
import langHtml from '@shikijs/langs/html';
import langJavascript from '@shikijs/langs/javascript';
import langJson from '@shikijs/langs/json';
import langMarkdown from '@shikijs/langs/markdown';
import langTypescript from '@shikijs/langs/typescript';
import langYaml from '@shikijs/langs/yaml';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import githubDark from '@shikijs/themes/github-dark';
// Pre-import only the themes and languages we need (fine-grained bundle)
import githubLight from '@shikijs/themes/github-light';
import MarkdownIt from 'markdown-it';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
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

const CONTENT_DIR = path.resolve(import.meta.dirname, '../../content');

// Section definitions — folder name = section id, order defines display order
export const SECTIONS: { id: string; label: string; order: number }[] = [
  { id: 'getting-started', label: 'Getting Started', order: 1 },
  { id: 'core', label: 'Core Concepts', order: 2 },
  { id: 'features', label: 'Features', order: 3 },
  { id: 'guides', label: 'Guides', order: 4 },
  { id: 'reference', label: 'Reference', order: 5 },
];

// Create highlighter synchronously with pre-loaded themes/langs
const highlighter = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [
    langJavascript,
    langTypescript,
    langBash,
    langJson,
    langHtml,
    langCss,
    langYaml,
    langMarkdown,
  ],
  engine: createJavaScriptRegexEngine(),
});

// Create markdown-it with Shiki — fully synchronous
const md = MarkdownIt({ html: true, linkify: true, typographer: true });

md.use(
  fromHighlighter(highlighter, {
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  })
);

// Override fence renderer — treat `vento` as `html`, catch truly unknown langs gracefully
const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  // Alias vento → html (syntax is close enough)
  if (token.info === 'vento') {
    token.info = 'html';
  }
  try {
    return defaultFence(tokens, idx, options, env, self);
  } catch {
    const escaped = md.utils.escapeHtml(token.content);
    return `<pre class="shiki shiki-themes github-light github-dark" style="background-color:#fff;color:#24292e;--shiki-dark-bg:#1a1814;--shiki-dark:#e8e8e3" tabindex="0"><code>${escaped}</code></pre>`;
  }
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

function getSections(): DocSection[] {
  const allDocs = getAllDocs();
  return SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    items: allDocs
      .filter((d: DocItem) => d.section === s.id)
      .toSorted((a: DocItem, b: DocItem) => a.order - b.order)
      .map((d: DocItem) => ({ slug: d.slug, title: d.title, order: d.order })),
  }));
}

// Hook for dynamic routes — returns array of docs
export default defineHooks('docs', async (params?: { slug?: string }) => {
  if (params?.slug) {
    const doc = getDocBySlug(params.slug);
    if (!doc) return null;
    return { ...doc, sections: getSections() };
  }
  return getAllDocs();
});

// Hook for docs index page — returns sections with docs
export const docsIndex = defineHooks('docsIndex', async () => {
  return { sections: getSections() };
});
