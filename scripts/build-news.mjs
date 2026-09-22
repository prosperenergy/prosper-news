import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import {pathToFileURL} from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire('/Users/craigstratton/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const {chromium} = require('playwright');
const attachment = '/Users/craigstratton/Library/Messages/Attachments/20/00/D83EAC7A-097A-4C04-9026-9A78E5F43CD4/Prosper-Solar-Is-the-Smarter-Bet.html';
const sourceDir = path.join(root, 'source');
const out = path.join(root, 'site');
const assets = path.join(out, 'assets');
const canonical = 'https://news.prospershield.io/';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
for (const d of [sourceDir, out, assets, path.join(root, 'outputs')]) fs.mkdirSync(d, {recursive:true});
const original = path.join(sourceDir, 'Prosper-Solar-Is-the-Smarter-Bet.html');
if (!fs.existsSync(original)) fs.copyFileSync(attachment, original);
let html = fs.readFileSync(original, 'utf8');
const sourceHash = hash(html);
const assetsByData = new Map();
const assetManifest = [];
for (const m of html.matchAll(/data:([\w.+/-]+);base64,([A-Za-z0-9+/=]+)/g)) {
  if (assetsByData.has(m[0])) continue;
  const bytes = Buffer.from(m[2], 'base64');
  const digest = hash(bytes).slice(0,16);
  let ext = {'font/woff2':'woff2','image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg'}[m[1]];
  if (!ext) throw new Error(`Unrecognized embedded media: ${m[1]}`);
  let output = bytes;
  if (m[1].startsWith('image/') && bytes.length > 150000 && ext !== 'svg') {
    output = await sharp(bytes).resize({width:1800,withoutEnlargement:true}).webp({quality:92}).toBuffer();
    ext = 'webp';
  }
  const assetPath = `/assets/${digest}.${ext}`;
  fs.writeFileSync(path.join(out, assetPath), output);
  assetsByData.set(m[0], assetPath);
  assetManifest.push({path:assetPath,sourceBytes:bytes.length,bytes:output.length,sha256:hash(output)});
}
html = html.replace(/data:([\w.+/-]+);base64,([A-Za-z0-9+/=]+)/g, data => assetsByData.get(data));
const replace = (from,to) => { if (!html.includes(from)) throw new Error(`Missing expected source text: ${from.slice(0,100)}`); html = html.replace(from,to); };
replace('<title>Solar Is the Smarter Bet. | Prosper Shield</title>', '<title>Solar Is the Smarter Bet. | Prosper News</title>');
replace('content="Prosper examines the science of solar, storage, and nuclear: cost, construction risk, life-cycle emissions, water, waste, and homeowner control."', 'content="Mini nuclear is a promise. Your roof is a power plant. Prosper’s research-backed case for solar, working systems, and storage designed around your home."');
replace('content="The research-backed case for solar and storage over new nuclear megaprojects."', 'content="The research-backed case for solar and storage. Check your solar performance, understand backup, and explore your next step with Prosper."');
const heroPath = html.match(/<figure><img src="([^"]+)" alt="Black-on-black/)[1];
const shareImage = '/assets/prosper-news-now-live-v1.jpg';
const localAsset = p => pathToFileURL(path.join(out,p)).href;
const logoPath = html.match(/<a class="brand"[^>]*><img src="([^"]+)"/)[1];
const displayFont = html.match(/font-family:Fander;src:url\('([^']+)'\)/)[1];
const bodyFont = html.match(/font-family:Geist;src:url\('([^']+)'\)/)[1];
const cardHtml = fs.readFileSync(path.join(root,'content/share-card.html'),'utf8')
  .replace('{{DISPLAY_FONT}}',localAsset(displayFont)).replace('{{BODY_FONT}}',localAsset(bodyFont))
  .replace('{{LOGO}}',localAsset(logoPath)).replace('{{HERO}}',localAsset(heroPath));
const cardPath = path.join(root,'outputs/share-card-render.html');
fs.writeFileSync(cardPath,cardHtml);
const cardBrowser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await cardBrowser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.goto(pathToFileURL(cardPath).href,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));});
  await page.screenshot({path:path.join(out,shareImage),type:'jpeg',quality:94});
  await page.screenshot({path:path.join(root,'outputs/prosper-news-now-live-card.png')});
} finally {await cardBrowser.close();}
replace('content="assets/prosper-black-panel-hero.png"', `content="${canonical.slice(0,-1)}${shareImage}"`);
replace('property="og:title" content="Solar Is the Smarter Bet."', 'property="og:title" content="Prosper News — Solar Is the Smarter Bet."');
replace('<span>Energy &amp;<br>Science</span>', '<span>Prosper News<br>Energy &amp; Science</span>');
replace('<p class="deck">The science works. The cost history is compelling. Stop making nuclear megaprojects the default answer to a problem solar and storage can tackle now.</p>', '<p class="position-line">Mini nuclear is a promise. Your roof is a power plant.</p><p class="deck">Build solar. Keep it performing. Add storage that fits your home. The evidence-backed case for taking control of your power today.</p>');
replace('<span>16 min read</span>', '<span>Homeowner guide updated September 12, 2026</span>');
replace('</div></div><figure><img', '</div><div class="quick-start"><a href="#system-check">Already have solar?</a><a href="#article">Read the evidence ↓</a></div></div><figure><img');
replace('<p><strong>Solar and batteries deserve to lead the next chapter of American energy. Building our affordability strategy around new nuclear megaprojects is the wrong bet.</strong></p>', '<p><strong>Solar and batteries deserve to lead the next chapter of American energy. Building a household’s energy plan around the promise of a future small modular reactor is the wrong bet.</strong></p><p>Small modular reactors deserve the same test as any proposed power plant: credible financing, licensing, construction, delivered electricity, and an honest account of cost and timing. A reactor announcement cannot diagnose an inverter fault, improve the solar already on your roof, or give your home backup power.</p>');
replace('<div class="layout">', fs.readFileSync(path.join(root,'content/system-check.html'),'utf8')+'\n<div class="layout">');
replace('<p><strong>A bill review and site audit turn a broad energy argument into a decision a homeowner can actually evaluate.</strong></p>', '<p><strong>A bill review and site audit turn a broad energy argument into a decision a homeowner can actually evaluate.</strong> Use <a href="#system-check">Prosper’s three-step solar and storage checklist</a> to prepare for that conversation.</p>');
const oldCta = /<section class="cta" id="next-step">[\s\S]*?<\/section>/;
if (!oldCta.test(html)) throw new Error('Missing source CTA');
html = html.replace(oldCta, '<section class="cta" id="next-step"><div class="shell"><div><h2>Your solar should work.<br>Your next move should too.</h2><p>Start with your production, your bill, and the way your home uses power. Get help with your existing system or explore a storage plan with Prosper.</p></div><div class="cta-actions"><a href="https://fixit.prospershield.io/">Get solar support ↗</a><a class="secondary" href="https://batteries.prospershield.io/">Explore battery upgrades ↗</a></div></div></section>');
replace('<button class="print-link" type="button" onclick="window.print()">Print / save PDF</button>', '<div class="share-actions"><a class="share-link" href="https://news.prospershield.io/">news.prospershield.io ↗</a><button class="print-link" type="button" onclick="window.print()">Print / save PDF</button><a class="share-link" href="/feed.xml">RSS feed</a></div><p class="print-address">Read and share: https://news.prospershield.io/</p>');
const css = fs.readFileSync(path.join(root,'content/news-overrides.css'),'utf8');
replace('</style>', css+'\n</style>');
const structured = {'@context':'https://schema.org','@type':'Article',headline:'Solar Is the Smarter Bet.',alternativeHeadline:'Mini nuclear is a promise. Your roof is a power plant.',description:'Prosper’s evidence-backed case for solar, system performance, and storage designed around the home.',datePublished:'2026-09-07T14:41:15-04:00',dateModified:new Date().toISOString(),author:{'@type':'Organization',name:'Prosper Shield',url:'https://prospershield.io/'},publisher:{'@type':'Organization',name:'Prosper Shield',url:'https://prospershield.io/'},mainEntityOfPage:canonical,image:canonical.slice(0,-1)+shareImage,inLanguage:'en-US'};
replace('<style>', `<link rel="canonical" href="${canonical}"><link rel="alternate" type="application/rss+xml" title="Prosper News" href="/feed.xml"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="Prosper News"><meta property="og:image:secure_url" content="${canonical.slice(0,-1)}${shareImage}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Prosper News — Now Live. Solar is the smarter bet. Working solar. Smarter storage."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Prosper News — Solar Is the Smarter Bet."><meta name="twitter:description" content="Mini nuclear is a promise. Your roof is a power plant. Read the evidence and plan your next step with Prosper."><meta name="twitter:image" content="${canonical.slice(0,-1)}${shareImage}"><meta name="apple-mobile-web-app-title" content="Prosper News"><script type="application/ld+json">${JSON.stringify(structured)}</script><style>`);
if (/half[\s_-]*life|portal[\s_-]*grok|grok_competition/i.test(html)) throw new Error('Unrelated content found');
if (html.includes('data:')) throw new Error('Unexpected inline data remains');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${canonical}sitemap.xml\n`);
fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${canonical}</loc><lastmod>2026-09-12</lastmod></url></urlset>\n`);
fs.writeFileSync(path.join(out,'feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Prosper News</title><link>${canonical}</link><description>Evidence, working solar, and storage for your home.</description><language>en-us</language><item><title>Solar Is the Smarter Bet.</title><link>${canonical}</link><guid isPermaLink="true">${canonical}</guid><pubDate>Mon, 07 Sep 2026 18:41:15 GMT</pubDate><description>Mini nuclear is a promise. Your roof is a power plant. Read Prosper’s case for solar and storage, then check the next step for your home.</description></item></channel></rss>\n`);
fs.writeFileSync(path.join(out,'404.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Prosper News</title><body style="font:20px/1.6 system-ui;max-width:650px;padding:40px;margin:auto"><h1>Find your next energy move.</h1><p>That page is not here. Read the current Prosper solar and storage resource.</p><a href="/">Go to Prosper News →</a></body></html>');
fs.writeFileSync(path.join(root,'outputs/build-manifest.json'),JSON.stringify({canonical,source:original,sourceSha256:sourceHash,originalBytes:fs.statSync(original).size,htmlBytes:Buffer.byteLength(html),assets:assetManifest,htmlSha256:hash(html),builtAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({canonical,sourceSha256:sourceHash,originalBytes:fs.statSync(original).size,htmlBytes:Buffer.byteLength(html),assetCount:assetManifest.length,assetBytes:assetManifest.reduce((sum,a)=>sum+a.bytes,0),output:out},null,2));
