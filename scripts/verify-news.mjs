import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const require = createRequire('/Users/craigstratton/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium} = require('playwright');
const root = path.resolve(import.meta.dirname, '..');
const base = process.argv[2];
assert(base?.startsWith('https://'), 'Pass the HTTPS preview or production URL');
const label = process.argv[3] || 'preview';
const out = path.join(root,'outputs');
const browser = await chromium.launch({channel:'chrome',headless:true});
const report = {url:base,checkedAt:new Date().toISOString(),viewports:[],routes:[],assets:[]};
try {
  for (const width of [1440,390,320]) {
    const page = await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    const response = await page.goto(base,{waitUntil:'networkidle',timeout:30000});
    assert.equal(response.status(),200);
    await page.evaluate(async()=>{
      document.querySelectorAll('img[loading="lazy"]').forEach(img=>img.loading='eager');
      await document.fonts.ready;
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>null)));
    });
    const state = await page.evaluate(()=>({
      title:document.title,
      canonical:document.querySelector('link[rel="canonical"]')?.href,
      h1:document.querySelector('h1')?.innerText,
      viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      brokenImages:[...document.images].filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src),
      references:document.querySelectorAll('.sources li[id^="ref-"]').length,
      cards:document.querySelectorAll('.home-plan-card').length,
      openGraph:Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map(m=>[m.getAttribute('property'),m.content])),
      brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href')),
      fonts:document.fonts.check('16px Fander')&&document.fonts.check('16px Geist'),
      ctas:[...document.querySelectorAll('.home-plan-card a,.cta a')].map(a=>({text:a.innerText,url:a.href})),
      assets:[...new Set([...document.querySelectorAll('img')].map(img=>img.getAttribute('src')))],
      unrelated:/half[\s_-]*life|portal[\s_-]*grok|grok_competition/i.test(document.body.innerText)
    }));
    assert.equal(state.canonical,'https://news.prospershield.io/');
    assert(state.h1.toLowerCase().includes('smarter bet'));
    assert(state.scrollWidth<=width,`Horizontal overflow at ${width}: ${state.scrollWidth}`);
    assert.equal(state.brokenImages.length,0,'Broken image');
    assert.equal(state.brokenAnchors.length,0,'Broken anchor');
    assert.equal(state.references,21);
    assert.equal(state.cards,3);
    assert.equal(state.openGraph['og:site_name'],'Prosper News');
    assert.equal(state.openGraph['og:image'],'https://news.prospershield.io/assets/prosper-news-now-live-v1.jpg');
    assert.equal(state.openGraph['og:image:width'],'1200');
    assert.equal(state.openGraph['og:image:height'],'630');
    assert.equal(state.fonts,true);
    assert.equal(state.unrelated,false);
    assert.equal(errors.length,0);
    await page.screenshot({path:path.join(out,`${label}-${width}-hero.png`)});
    if(width!==320){
      await page.locator('#system-check').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`${label}-${width}-system-check.png`)});
    }
    if(width===1440){
      const poster=page.locator('[data-video]').first();
      const id=await poster.getAttribute('data-video');
      await poster.click();
      await page.waitForFunction(id=>document.querySelector(`iframe[src*="${id}"]`),id);
      state.videoActivation=await page.locator(`iframe[src*="${id}"]`).getAttribute('src');
      report.assets=state.assets;
      report.assets.push('/assets/prosper-news-now-live-v1.jpg');
    }
    report.viewports.push({...state,errors});
    await page.close();
  }
  for (const route of ['/','/news/','/news/mini-nuclear-is-a-promise/','/mini-nuclear-is-a-promise/','/solar-is-the-smarter-bet/','/feed.xml','/sitemap.xml','/robots.txt']) {
    const r=await fetch(new URL(route,base));
    const text=await r.text();
    assert.equal(r.status,200,`Route failed: ${route}`);
    report.routes.push({route,status:r.status,finalUrl:r.url,bytes:Buffer.byteLength(text)});
  }
  for(const asset of report.assets){
    const r=await fetch(new URL(asset,base));
    const bytes=Buffer.from(await r.arrayBuffer());
    assert.equal(r.status,200);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'site',asset))).digest('hex'));
  }
  const live=await fetch(base).then(r=>r.text());
  assert.equal(live,fs.readFileSync(path.join(root,'site/index.html'),'utf8'),'Hosted HTML must match the tested build exactly');
  report.passed=true;
  fs.writeFileSync(path.join(out,`${label}-verification.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:true,url:base,viewports:report.viewports.map(v=>({width:v.viewport,scrollWidth:v.scrollWidth,imagesBroken:v.brokenImages.length,references:v.references,cards:v.cards,fonts:v.fonts})),routes:report.routes,report:path.join(out,`${label}-verification.json`)},null,2));
} finally {await browser.close();}
