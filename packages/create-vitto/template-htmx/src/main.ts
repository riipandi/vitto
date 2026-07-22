import './styles/global.css';
import htmx from 'htmx.org';

declare global {
  interface Window {
    htmx: typeof htmx;
  }
}

window.htmx = htmx;

// Configure HTMX
document.addEventListener('DOMContentLoaded', () => {
  // Transform JSON response to HTML
  document.body.addEventListener('htmx:beforeSwap', (event: any) => {
    const isJsonResponse = event.detail.xhr
      .getResponseHeader('content-type')
      ?.includes('application/json');

    if (isJsonResponse) {
      try {
        const posts = JSON.parse(event.detail.xhr.responseText);
        const html = posts
          .map(
            (post: any) => `
          <div class="post-card">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-body">${post.body}</p>
            <div class="post-meta">
              <span class="post-id">ID: ${post.id}</span>
              <span class="post-user">User: ${post.userId}</span>
            </div>
          </div>
        `
          )
          .join('');

        // Set the server response to our transformed HTML
        event.detail.serverResponse = html;
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
      }
    }
  });

  document.body.addEventListener('htmx:afterSwap', (event) => {
    console.info('HTMX content swapped:', event);
  });
});
