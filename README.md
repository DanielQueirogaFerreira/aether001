# Aether

Paint with light. A full-screen particle studio.

**Version:** 1.0.1

## Cloudflare Pages

The GitHub repo `aether001` is the source. Cloudflare should build from `main`.

| Setting | Value |
| --- | --- |
| Framework | None |
| Build command | `npm run build:cf` |
| Output directory | `dist` |
| Node | 22 |

Local:

```
npm install
npm run build:cf
npx wrangler pages deploy dist
```
