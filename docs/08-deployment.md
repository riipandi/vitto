# Deployment

Vitto generates a static site that can be deployed to any static hosting platform. This guide covers deployment to popular platforms.

## Building for Production

Before deploying, build your site for production:

```bash
npm run build
```

This creates an optimized static site in the `dist/` directory with:
- Minified HTML, CSS, and JavaScript
- Optimized assets with cache-busting hashes
- Generated search index (if enabled)
- All static pages ready to serve

## Platform-Specific Guides

### Vercel

Vercel provides zero-configuration deployment for static sites.

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
vercel
```

Or connect your Git repository on [vercel.com](https://vercel.com) for automatic deployments.

#### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite"
}
```

### Netlify

Deploy to Netlify using Git or drag-and-drop.

#### Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Using Git

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect repository on [netlify.com](https://netlify.com)
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Cloudflare Pages

Deploy to Cloudflare Pages for global edge delivery.

#### Using Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Deploy
wrangler pages deploy dist
```

#### Using Git

1. Push code to GitHub/GitLab
2. Connect repository on [pages.cloudflare.com](https://pages.cloudflare.com)
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

### GitHub Pages

Deploy to GitHub Pages for free hosting.

#### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Base Path Configuration

If deploying to a subdirectory (e.g., `username.github.io/repo-name`), configure the base path:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vitto from 'vitto'

export default defineConfig({
  base: '/repo-name/', // Your repository name
  plugins: [vitto()]
})
```

### Azure Static Web Apps

Deploy to Azure for enterprise-grade hosting.

#### Configuration

Create `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: "dist"
```

### AWS Amplify

Deploy to AWS Amplify for scalable hosting.

#### Configuration

Create `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### DigitalOcean App Platform

Deploy to DigitalOcean for simple cloud hosting.

#### Configuration

1. Connect your repository on [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Configure app settings:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Environment**: Node.js

Or use `app.yaml`:

```yaml
name: vitto-site
static_sites:
  - name: web
    github:
      repo: username/repo-name
      branch: main
      deploy_on_push: true
    build_command: npm run build
    output_dir: dist
    routes:
      - path: /
```

### Render

Deploy to Render for managed static hosting.

#### Configuration

Create `render.yaml`:

```yaml
services:
  - type: web
    name: vitto-site
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Firebase Hosting

Deploy to Firebase for Google Cloud infrastructure.

#### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting
```

#### Configuration

Update `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### Deploy

```bash
firebase deploy
```

### Self-Hosted (VPS)

Deploy to your own server using Nginx or Apache.

#### Using Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/vitto-site/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Using Apache

```apache
<VirtualHost *:80>
    ServerName example.com
    DocumentRoot /var/www/vitto-site/dist

    <Directory /var/www/vitto-site/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Enable rewriting
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript text/xml application/xml
    </IfModule>

    # Cache static files
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
</VirtualHost>
```

## Environment Variables

Different platforms handle environment variables differently.

### Build-Time Variables

Access via `import.meta.env`:

```ts
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
})
```

### Platform-Specific

**Vercel**: Settings → Environment Variables

**Netlify**: Site settings → Build & deploy → Environment

**Cloudflare Pages**: Settings → Environment variables

**GitHub Actions**: Repository → Settings → Secrets and variables

## Custom Domains

### Vercel

```bash
vercel domains add example.com
```

### Netlify

Site settings → Domain management → Add custom domain

### Cloudflare Pages

Workers & Pages → Your site → Custom domains → Set up a custom domain

### GitHub Pages

Repository → Settings → Pages → Custom domain

## Performance Optimization

### Enable Compression

Most platforms enable gzip/brotli automatically. Verify in your hosting settings.

### CDN Configuration

Use platform CDN features:

- **Vercel**: Edge Network (automatic)
- **Netlify**: Global CDN (automatic)
- **Cloudflare Pages**: Global network (automatic)

### Cache Headers

Configure in your hosting platform or web server:

```
# Static assets
Cache-Control: max-age=31536000, immutable

# HTML files
Cache-Control: max-age=0, must-revalidate
```

## Continuous Deployment

### Automatic Deployments

Most platforms support automatic deployments on Git push:

1. Connect your repository
2. Configure build settings
3. Push to main branch → automatic deploy

### Deploy Previews

Platforms like Vercel, Netlify, and Cloudflare Pages automatically create preview deployments for pull requests.

### Build Hooks

Trigger builds programmatically:

**Netlify**:
```bash
curl -X POST -d {} https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

**Vercel**:
```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/YOUR_HOOK_ID
```

## Monitoring

### Analytics

Add analytics to track visitors:

**Google Analytics**:
```vento
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Plausible Analytics**:
```vento
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

### Error Tracking

**Sentry**:
```html
<script
  src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"
  crossorigin="anonymous"
></script>
<script>
  Sentry.init({ dsn: 'YOUR_DSN' });
</script>
```

## Troubleshooting

### 404 Errors on Refresh

Configure rewrites to serve `index.html` for all routes. See platform-specific configurations above.

### Build Failures

1. Check Node.js version matches your local environment
2. Verify all dependencies are in `package.json`
3. Check build logs for specific errors
4. Ensure environment variables are set

### Slow Builds

1. Use `npm ci` instead of `npm install`
2. Enable build caching
3. Optimize hook data fetching
4. Consider build time limits of your platform

## Best Practices

### 1. Use Environment-Specific Configurations

```ts
export default defineConfig(({ mode }) => ({
  plugins: [
    vitto({
      minify: mode === 'production',
      enableSearchIndex: mode === 'production'
    })
  ]
}))
```

### 2. Test Builds Locally

```bash
npm run build
npm run preview
```

### 3. Monitor Build Times

Keep builds under platform limits:
- Vercel Free: 45 minutes
- Netlify Free: 300 minutes/month
- GitHub Pages: No limit

### 4. Use .gitignore

```
node_modules/
dist/
.env
.env.local
```

### 5. Version Lock Dependencies

Use `package-lock.json` or `pnpm-lock.yaml` for consistent builds.

## Next Steps

- [Performance](./09-performance.md) - Optimize your site for speed
- [Examples](./10-examples.md) - Real-world examples and templates
- [Troubleshooting](./11-troubleshooting.md) - Common issues and solutions
