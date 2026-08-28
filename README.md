# Aether

Paint with light. A full-screen particle studio.

**Version:** 1.0.2

Live: [danielqueirogaferreira.github.io/aether001](https://danielqueirogaferreira.github.io/aether001/)

## GitHub Pages

The studio is published from the `gh-pages` branch (built `index.html` + assets). A push to `main` rebuilds and updates that branch.

## Cloudflare Pages

If the site still shows **Hello World**, the Pages project is still the starter template — it is not building this repo yet.

In Cloudflare → Workers & Pages → `aether001` → Settings → Builds:

| Setting | Value |
| --- | --- |
| Connect to Git | `DanielQueirogaFerreira/aether001` |
| Production branch | `main` |
| Framework | None |
| Build command | `npm run build:cf` |
| Build output | `dist` |
| Node | `22` |

Save, then **Retry deployment**. Cloudflare needs the worker (`_worker.js`) from `npm run build:cf` — a Hello World upload will not become Aether on its own.

## Local

```
npm install
npm run dev
```
