# Prosper News

Source for https://news.prospershield.io

Imported from Mac Codex `2026-09-07/mini-nuclear-is-a-promise-your` (Craig GO 2026-09-21).

See `README-KNOWLEDGE-BASE.md` for build notes.

## Homepage and battery viewer

Run `npm ci` and `npm run build` to rebuild the self-hosted Three.js viewer and static pages. The default build preserves the existing share image and does not launch a browser. Optional share-image regeneration retains the original local Playwright/Chrome requirement.

Run `node scripts/test-battery-viewer.mjs` for browser-free interaction tests. These use real scene geometry with a simulated renderer; they are not a replacement for rendered mobile/desktop screenshots.

The Enphase and Tesla views are simplified illustrative enclosures, not manufacturer CAD or installation references. Visitors can select either model, drag horizontally through 360 degrees, use arrow keys, run one complete spin, or reset. Reduced-motion users never receive automatic animation; spin is explicitly requested. WebGL failure leaves a static product image and an explanatory message.

Homepage layout source: `content/knowledge/home.css` and `homepage-feature.html`. Viewer source: `content/knowledge/battery-viewer.mjs`. Preserve the original official Prosper logo and fonts, source-room content, article routes, intake destinations, and existing videos.
