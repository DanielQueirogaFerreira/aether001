# Aether

Paint with light. A full-screen particle studio.

**Version:** 1.0.2

Live: [danielqueirogaferreira.github.io/aether001](https://danielqueirogaferreira.github.io/aether001/)

GitHub Pages is served from `index.html` at the root of `main` (not this README).

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

Save, then **Retry deployment**. Aether will not replace Hello World until Cloudflare builds this repository.

## Local

```
npm install
npm run dev
```
