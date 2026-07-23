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

const DOCS_DIR = path.resolve(import.meta.dirname, '../../../docs');

export const SECTIONS: { id: string; label: string; slugs: string[] }[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    slugs: ['01-introduction', '02-getting-started', '03-configuration'],
  },
  {
    id: 'core-concepts',
    label: 'Core Concepts',
    slugs: ['04-templating', '05-dynamic-routes', '06-hooks'],
  },
  {
    id: 'features',
    label: 'Features',
    slugs: ['07-search', '08-deployment', '09-performance'],
  },
  {
    id: 'reference',
    label: 'Reference',
    slugs: [
      '10-examples',
      '11-troubleshooting',
      '12-api-reference',
      '13-contributing',
      '14-comparison',
    ],
  },
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

// Override fence renderer to gracefully handle unknown languages (e.g. vento, toml)
const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  try {
    return defaultFence(tokens, idx, options, env, self);
  } catch {
    const token = tokens[idx];
    const escaped = md.utils.escapeHtml(token.content);
    return `<pre class="shiki shiki-themes github-light github-dark" style="background-color:#fff;color:#24292e;--shiki-dark-bg:#1a1814;--shiki-dark:#e8e8e3" tabindex="0"><code>${escaped}</code></pre>`;
  }
};

function parseDocFile(filePath: string): DocItem | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');

    // Extract first heading as title
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || fileName;

    // Extract description (first paragraph after title)
    const descMatch = raw.replace(/^#.+$/m, '').match(/\n\n(.+?)(?:\n\n|$)/);
    const description = descMatch?.[1]?.trim() || '';

    // Convert markdown to HTML with Shiki highlighting (synchronous)
    const content = md.render(raw);

    // Extract order number from filename
    const orderMatch = fileName.match(/^(\d+)/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 99;

    const slug = fileName;

    // Find section
    let section = 'reference';
    let sectionLabel = 'Reference';
    for (const s of SECTIONS) {
      if (s.slugs.includes(slug)) {
        section = s.id;
        sectionLabel = s.label;
        break;
      }
    }

    return { slug, title, description, content, order, section, sectionLabel };
  } catch {
    return null;
  }
}

function getAllDocs(): DocItem[] {
  if (!fs.existsSync(DOCS_DIR)) return [];

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
  const docs = files.map((f) => parseDocFile(path.join(DOCS_DIR, f))).filter(Boolean) as DocItem[];

  // Sort by order
  docs.sort((a, b) => a.order - b.order);
  return docs;
}

function getDocBySlug(slug: string): DocItem | null {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseDocFile(filePath);
}

function getSections(): DocSection[] {
  const allDocs = getAllDocs();
  return SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    items: s.slugs
      .map((slug) => {
        const doc = allDocs.find((d) => d.slug === slug);
        return doc ? { slug: doc.slug, title: doc.title, order: doc.order } : null;
      })
      .filter(Boolean) as { slug: string; title: string; order: number }[],
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
