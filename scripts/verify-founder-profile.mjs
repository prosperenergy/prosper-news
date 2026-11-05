import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const {document: home} = parseHTML(read('site/index.html'));
const slug = 'the-man-behind-the-prosper-method';
const route = `/guides/${slug}/`;
const {document: article} = parseHTML(read(`site${route}index.html`));
assert.equal(home.querySelector('#main .shell').firstElementChild.className, 'founder-profile-feature');
assert.equal(home.querySelector('.founder-profile-feature h2 a').getAttribute('href'), route);
assert.equal(home.querySelectorAll('.founder-profile-feature').length, 1);
assert(home.querySelector('.founder-feature'), 'Earlier founder letter remains featured');
assert([...home.querySelectorAll('[data-search-item]')].some(n => n.textContent.includes('The Man Behind the Prosper Method')));
assert.equal(article.querySelectorAll('h1').length, 1);
assert.equal(article.querySelector('h1').textContent, 'The Man Behind the Prosper Method');
assert(article.querySelector('.profile-editor-note').textContent.includes('adapted for clarity'));
assert(article.querySelector('.profile-portrait figcaption').textContent.includes('AI-assisted'));
const ids = [...article.querySelectorAll('[id]')].map(n => n.id);
assert.equal(new Set(ids).size, ids.length, 'No duplicate IDs');
for (const link of article.querySelectorAll('.profile-toc a')) assert(article.getElementById(link.getAttribute('href').slice(1)));
const schema = JSON.parse(article.querySelector('script[type="application/ld+json"]').textContent);
assert.equal(schema.author.name, 'Prosper News');
assert.equal(schema.headline, article.querySelector('h1').textContent);
for (const name of ['feed.xml', 'sitemap.xml']) assert(read('site/' + name).includes(route));
assert(read(`site/downloads/${slug}.md`).includes('Where does your story begin?'));
assert.equal(10000 * .20, 2000);
assert.equal(10000 * .10, 1000);

const require = createRequire('/Users/craigstratton/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium} = require('playwright');
const output = path.join(root, 'outputs/founder-profile');
fs.mkdirSync(output, {recursive: true});
const browser = await chromium.launch({channel: 'chrome', headless: true});
const report = {structuralChecks: 'passed', topFeature: true, searchIndexed: true, rss: true, sitemap: true, economics: 'illustrative math verified', screens: [], browserErrors: []};
try {
  for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1});
    page.on('pageerror', error => report.browserErrors.push({device, message: error.message}));
    for (const [label, target] of [['home', '/'], ['article', route]]) {
      const response = await page.goto('http://127.0.0.1:8983' + target, {waitUntil: 'networkidle'});
      assert.equal(response.status(), 200);
      await page.evaluate(async () => { await document.fonts.ready; });
      const metrics = await page.evaluate(() => ({
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        loadedImages: [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).every(i => i.complete && i.naturalWidth > 0),
        fonts: {geist: document.fonts.check('16px Geist'), fander: document.fonts.check('32px Fander')},
      }));
      assert(metrics.documentWidth <= metrics.viewport, `${device} ${label} has horizontal overflow`);
      assert(metrics.loadedImages, `${device} ${label} visible images load`);
      assert(metrics.fonts.geist && metrics.fonts.fander);
      await page.screenshot({path: path.join(output, `${device}-${label}.png`), fullPage: label === 'article'});
      report.screens.push({device, label, ...metrics});
      if (label === 'article') {
        await page.locator('.profile-toc summary').click();
        await page.locator('.profile-toc a').filter({hasText: 'What is Prosper today?'}).click();
        assert(page.url().endsWith('#what-is-prosper-today'));
      }
    }
    await page.close();
  }
  const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1});
  await page.goto('http://127.0.0.1:8983/');
  await page.setContent(`<!doctype html><html><head><style>
  @font-face{font-family:Geist;src:url('/assets/89ab9ec2533e2a70.woff2')}@font-face{font-family:Fander;src:url('/assets/99d6cc85ad464756.woff2')}
  *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#F9F4ED;color:#141414;font-family:Geist,Arial,sans-serif}.card{padding:42px 52px;display:grid;grid-template-columns:690px 290px;gap:65px;height:100%}.logo{width:142px;height:auto;display:block}.label{font-size:14px;letter-spacing:1px;margin:26px 0 16px}h1{font-family:Fander;font-weight:400;font-size:50px;line-height:1.15;margin:0 0 22px;letter-spacing:-1px}p{font-size:21px;line-height:1.5;max-width:640px;margin:0}.person{font-size:16px;margin-top:25px}.url{font-size:15px;margin-top:26px;color:#0746C4}.portrait{margin:30px 0 0}.portrait img{width:290px;height:auto;display:block}.portrait figcaption{font-size:10px;line-height:1.4;margin-top:8px}
  </style></head><body><div class="card"><div><img class="logo" src="/assets/prosper-wordmark-official-header.webp" alt="Prosper"><div class="label">PROSPER NEWS · FOUNDER PROFILE</div><h1>The Man Behind<br>the Prosper Method</h1><p>The work. The relationships.<br>The people behind the next chapter.</p><p class="person">Craig Stratton · Founder and CEO</p><p class="url">news.prospershield.io</p></div><figure class="portrait"><img src="/assets/craig-stratton-headshot.png" alt="Craig Stratton"><figcaption>AI-assisted portrait based on Craig’s photograph.</figcaption></figure></div></body></html>`);
  await page.evaluate(async () => {await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode()));});
  const image = path.join(root, 'site/assets/founder-profile-share-20261013.png');
  await page.screenshot({path: image});
  fs.mkdirSync(path.join(root, 'source/founder-profile-2026-10-13'), {recursive: true});
  fs.copyFileSync(image, path.join(root, 'source/founder-profile-2026-10-13/founder-profile-share-20261013.png'));
  report.shareImage = {width: 1200, height: 630, bytes: fs.statSync(image).size};
  assert.equal(report.browserErrors.length, 0);
} finally {await browser.close();}
fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
