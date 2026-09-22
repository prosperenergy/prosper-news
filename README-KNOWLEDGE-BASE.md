# Prosper News knowledge base

Live: https://news.prospershield.io/

September 15, 2026 edition: 10 guides, 37 source records, two calculators, source library, editorial disclosure and preserved archive. Craig's supplied research brief is integrated into the flagship article. The homepage includes his 5:40 storage explainer, a click-to-load YouTube player and context for its examples. Current production deploy: `6aa9993e1eca3500c80dcd03`, locked. Prior deploy retained for rollback: `6aa8aaa95e9b478163626a53`.

The site uses the official Prosper wordmark and bolt, Happy Blue `#0B5CFF`, Prosper yellow `#F4FF00`, cream `#F9F4ED`, white and ink. Original brand files are copied from the verified brand lock in `source/brand-2026-09-15/`; the builder validates the logo and bolt hashes.

## Current editing and build path

- Author content in `content/knowledge/*.md`; article and source definitions are in `catalog.mjs`.
- Styles and browser interaction code live in the same folder.
- Build using `node scripts/build-knowledge-base.mjs`.
- Preview with `node scripts/serve-knowledge-base.mjs` at http://127.0.0.1:4317.
- Verify using `node scripts/verify-knowledge-base.mjs <base-url> <label>`.
- HTTP and artifact verification without browser automation: `node scripts/verify-news-http.mjs <https-base-url> <label>`. Current browser QA uses the in-app browser, measured viewport widths and visual inspection.
- `scripts/build-news.mjs` is the **legacy single-article builder**. Do not run it for current releases: it would replace the knowledge-base homepage with the earlier format.

The build uses the configured bundled Node dependencies for Marked, Playwright and Sharp. All original images and earlier source files are preserved. Generated site content goes to `site/`.

The original release script is pinned to September 14 and must not be reused. `scripts/promote-reviewed-deploy.mjs` accepts a reviewed release configuration with the exact site, expected prior deployment, target deployment and QA records. Future releases require a new verified preview and a fresh check of the exact site and current deployment. Preserve the site's locked-production posture and do not change DNS or unrelated sites.

## Verification and delivery

- `outputs/knowledge-base/brand-2026-09-15/production-http.json`: all 13 current pages match the tested local HTML; 154 internal link targets and 9 active assets passed; baseline arithmetic passed.
- `outputs/knowledge-base/brand-2026-09-15/preview-visual.json`: 39 measured page/viewport checks, search/filter/reset, both calculators, copied results, share-card inspection and observed video playback. The new video card's mobile overflow was corrected.
- `outputs/knowledge-base/brand-2026-09-15/release.json`: September 15 production, rollback and lock read-back.
- `outputs/knowledge-base/brand-2026-09-15/before-brand-correction.tar.gz`: local pre-edit source and site backup.

September 14 delivery records remain preserved:

- `outputs/knowledge-base/production-verification.json`: 39 page/viewport combinations, 59 internal links and anchors, asset hash checks, calculator/search/share/no-JavaScript tests. Additional homepage checks cover 768 and 1024 pixels.
- `outputs/knowledge-base/source-link-check.json`: 40 external source/CTA checks; 29 reachable by automated HTTP, 10 restricted to automation, one network timeout. Source content was separately researched; HTTP reachability is not substantive verification. Do not claim every publisher accepted automated requests.
- `outputs/knowledge-base/release.json`: exact production ID, rollback ID and restored lock.
- `outputs/knowledge-base/EMAIL-TO-ZAC.txt`: actual sent email body.
- `outputs/knowledge-base/SEND-RECEIPT.md`: Gmail Sent proof and attachment sizes.
- `outputs/knowledge-base/PROSPER-RESEARCH-FOR-ZAC-2026-09-14.zip`: tested 25-file derivative research package.

The 1200 × 630 social image is `/assets/prosper-knowledge-base-share-20260915.jpg`. Its new filename avoids reusing the old green image URL. OG/Twitter metadata and delivered bytes were verified. An iMessage conversation was not used for testing; messaging-service caches can still retain earlier previews. No SMS, responder daemon, CRM, mail DNS or credential changes were made. The September 15 update did not send a new email to Zac.
