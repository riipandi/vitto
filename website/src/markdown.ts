import { alert } from '@mdit/plugin-alert';
import { anchor } from '@mdit/plugin-anchor';
import { tab } from '@mdit/plugin-tab';
import { tasklist } from '@mdit/plugin-tasklist';
import MarkdownIt from 'markdown-it';
import frontMatter from 'markdown-it-front-matter';

import { useShiki } from './shiki';

/** Create a fully-configured markdown-it instance shared by docs and blog. */
export function createMarkdownRenderer(): MarkdownIt {
  const md = MarkdownIt({ html: true, linkify: true, typographer: true });

  useShiki(md);
  md.use(frontMatter, () => {});
  md.use(anchor, { level: [2, 3, 4] });
  md.use(alert);
  md.use(tab, { name: 'tabs' });
  md.use(tasklist, { disabled: true, label: true });

  // Override fence renderer — wrap Shiki output in container with copy button
  const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info === 'vento') token.info = 'html';

    let codeHtml: string;
    try {
      codeHtml = defaultFence(tokens, idx, options, env, self);
    } catch {
      const escaped = md.utils.escapeHtml(token.content);
      codeHtml = `<pre class="shiki shiki-themes github-light github-dark" tabindex="0" style="background-color:#fff;color:#24292e;--shiki-dark-bg:#24292e;--shiki-dark:#e1e4e8"><code>${escaped}</code></pre>`;
    }

    const lang = token.info || 'code';
    const encoded = Buffer.from(token.content).toString('base64');
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

  return md;
}
