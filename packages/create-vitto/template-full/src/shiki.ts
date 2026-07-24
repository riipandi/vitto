import langAstro from '@shikijs/langs/astro';
import langBash from '@shikijs/langs/bash';
import langCss from '@shikijs/langs/css';
import langHtml from '@shikijs/langs/html';
import langJavascript from '@shikijs/langs/javascript';
import langJson from '@shikijs/langs/json';
import langMarkdown from '@shikijs/langs/markdown';
import langTsx from '@shikijs/langs/tsx';
import langTypescript from '@shikijs/langs/typescript';
import langYaml from '@shikijs/langs/yaml';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import githubDark from '@shikijs/themes/github-dark';
import githubLight from '@shikijs/themes/github-light';
import type MarkdownIt from 'markdown-it';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

/** Pre-built Shiki highlighter instance */
export const highlighter = createHighlighterCoreSync({
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
    langTsx,
    langAstro,
  ],
  engine: createJavaScriptRegexEngine(),
});

/** Register Shiki syntax highlighting on a markdown-it instance */
export function useShiki(md: MarkdownIt): void {
  md.use(
    fromHighlighter(highlighter as any, {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    })
  );
}
