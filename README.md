# Prosper News

Source for https://news.prospershield.io

Imported from Mac Codex `2026-09-07/mini-nuclear-is-a-promise-your` (Craig GO 2026-09-21).

See `README-KNOWLEDGE-BASE.md` for build notes.

## Homepage and battery viewer

Run `npm ci` and `npm run build` to rebuild the self-hosted Three.js viewer and static pages. The default build preserves the existing share image and does not launch a browser. Optional share-image regeneration retains the original local Playwright/Chrome requirement.

Run `node scripts/test-battery-viewer.mjs` for browser-free interaction tests. These use real scene geometry with a simulated renderer; they are not a replacement for rendered mobile/desktop screenshots.

The Enphase and Tesla views are simplified illustrative enclosures, not manufacturer CAD or installation references. Visitors can select either model, drag horizontally through 360 degrees, use arrow keys, run one complete spin, or reset. Reduced-motion users never receive automatic animation; spin is explicitly requested. WebGL failure leaves a static product image and an explanatory message.

Homepage layout source: `content/knowledge/home.css` and `homepage-feature.html`. Viewer source: `content/knowledge/battery-viewer.mjs`. Preserve the original official Prosper logo and fonts, source-room content, article routes, intake destinations, and existing videos.

## Founder letter

The featured founder letter lives at `/guides/be-the-one-they-follow/` and is indexed in the homepage article search, RSS feed and sitemap. Its final v3 copy is in `content/knowledge/founder-letter.json`; the matching Markdown file supplies search and download text. Update both when editing copy. Layout and styles are scoped in `founder-letter.mjs` and `founder-letter.css`.

Run `npm run build` and `node scripts/verify-founder-letter.mjs`. The latter checks every paragraph against the structured copy, the qualified representative commission terms, source links, metadata and discovery paths. Existing pages are preserved. Before release, use a new preview, `scripts/verify-news-http.mjs`, and desktop/mobile visual checks. Promote only the tested deploy with the current site/deploy IDs and preserve the production lock.

The founder letter now uses supplied portrait v3 (Library version 2). `content/knowledge/prosper-network.html`, its stylesheet, and the homepage product catalog preserve production deploy `6ac2911dfd3e3e0a721bf1a5`. Rebuilds preserve the existing navigation, battery product photos and every unrelated page. The author portrait is labeled AI-assisted in the article.

Regenerate the founder sharing image with `node scripts/founder-share.cjs http://127.0.0.1:4331`, using a local server rooted at `site`, then rebuild. `node scripts/founder-visual.cjs <preview-url> preview-v3` captures desktop, tablet and phone views.
