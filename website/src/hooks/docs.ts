import fs from 'node:fs';
import path from 'node:path';

import Shiki from '@shikijs/markdown-it';
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

// markdown-it + Shiki singleton — cache the promise to avoid race conditions
let mdPromise: Promise<MarkdownIt> | null = null;

function getMd(): Promise<MarkdownIt> {
  if (!mdPromise) {
    mdPromise = (async () => {
      const md = MarkdownIt({ html: true, linkify: true, typographer: true });
      md.use(
        await Shiki({
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          langAlias: {
            vento: 'html',
          },
        })
      );
      return md;
    })();
  }
  return mdPromise;
}

async function parseDocFile(filePath: string): Promise<DocItem | null> {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');

    // Extract first heading as title
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || fileName;

    // Extract description (first paragraph after title)
    const descMatch = raw.replace(/^#.+$/m, '').match(/\n\n(.+?)(?:\n\n|$)/);
    const description = descMatch?.[1]?.trim() || '';

    // Convert markdown to HTML with Shiki highlighting
    const md = await getMd();
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

async function getAllDocs(): Promise<DocItem[]> {
  if (!fs.existsSync(DOCS_DIR)) return [];

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
  const docs = (await Promise.all(files.map((f) => parseDocFile(path.join(DOCS_DIR, f))))).filter(
    Boolean
  ) as DocItem[];

  // Sort by order
  docs.sort((a, b) => a.order - b.order);
  return docs;
}

async function getDocBySlug(slug: string): Promise<DocItem | null> {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseDocFile(filePath);
}

async function getSections(): Promise<DocSection[]> {
  const allDocs = await getAllDocs();
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
    const doc = await getDocBySlug(params.slug);
    if (!doc) return null;
    return { ...doc, sections: await getSections() };
  }
  return getAllDocs();
});

// Hook for docs index page — returns sections with docs
export const docsIndex = defineHooks('docsIndex', async () => {
  return { sections: await getSections() };
});
