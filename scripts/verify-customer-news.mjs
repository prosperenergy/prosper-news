import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {articles} from '../content/knowledge/catalog.mjs';
const require=createRequire('/Users/craigstratton/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {webkit}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:5317';
const label=process.argv[3]||'local';
const out=path.resolve('outputs/customer-news-2026-09-17');
fs.mkdirSync(out,{recursive:true});
const browser=await webkit.launch({headless:true});
const screenshots=[];
const checks=[];
try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.hero-media img').evaluate(i=>i.decode());
    assert.match(await page.locator('h1').innerText(),/Your solar should/);
    assert.equal(await page.locator('.featured-guides .guide-card').count(),3);
    assert.equal(await page.locator('#all-guides').getAttribute('open'),null);
    assert.equal(await page.locator('#tools').getAttribute('open'),null);
    assert.equal(await page.locator('.evidence-strip').count(),0);
    assert.equal(await page.locator('iframe').count(),0,'Video must not load before consent to play');
    const shape=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,heroCTA:document.querySelector('[data-news-cta="hero"]').getBoundingClientRect().toJSON(),colors:{blue:getComputedStyle(document.documentElement).getPropertyValue('--blue').trim(),paper:getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()}}));
    assert.equal(shape.width,width);
    assert(shape.scroll<=width,`${name}: horizontal overflow`);
    assert(shape.heroCTA.top<height,`${name}: main action must be above fold`);
    assert.equal(shape.colors.blue,'#0b5cff');
    assert.equal(shape.colors.paper,'#f9f4ed');
    const shot=path.join(out,`${label}-${name}.png`);
    await page.screenshot({path:shot,fullPage:name==='desktop'});
    screenshots.push(shot);
    await page.locator('#all-guides > summary').click();
    await page.getByRole('searchbox').fill('Darlington');
    assert(await page.locator('[data-search-item]:visible').count()>0);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.locator('[data-search-item]:visible').count(),articles.length);
    await page.goto(`${base}/#tools`);
    await page.waitForFunction(()=>document.getElementById('tools').open);
    await page.goto(`${base}/guides/solar-performance/`);
    assert.equal(await page.locator('[data-news-cta="article-intro"]').count(),1);
    if(width<=760){
      await page.locator('.prose h2').nth(2).scrollIntoViewIfNeeded();
      await page.locator('.mobile-action').waitFor({state:'visible'});
      const sticky=await page.locator('.mobile-action').boundingBox();
      assert(sticky.y>=0&&sticky.y+sticky.height<=height+1);
    }
    const urls=await page.locator('[data-news-cta]').evaluateAll(links=>links.map(l=>l.href));
    for(const href of urls){const url=new URL(href);assert.equal(url.origin,'https://prospershield.io');assert.equal(url.pathname,'/join/');assert.equal(url.searchParams.get('utm_source'),'prosper-news');assert(url.searchParams.get('utm_content'));}
    assert.deepEqual(errors,[]);
    checks.push({name,width,height,aboveFoldAction:true,noHorizontalOverflow:true,researchDisclosureWorks:true,sourceAttribution:true});
    await context.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(base);
  await page.locator('[data-news-cta="hero"]').click();
  await page.waitForURL('https://prospershield.io/join/**');
  await page.locator('form[name="assessment"]:not([hidden])').waitFor({state:'visible'});
  assert(await page.locator('form[name="assessment"]:not([hidden]) input[name="email"]').isVisible());
  assert(await page.locator('form[name="assessment"]:not([hidden]) button[type="submit"]').isVisible());
  const intake={url:page.url(),form:'assessment',requestFormVisible:true,submissionSent:false};
  await page.screenshot({path:path.join(out,`${label}-assessment-destination.png`),fullPage:true});
  await page.goto(base);
  await page.locator('[data-video]').click();
  assert.match(await page.locator('[data-video-stage] iframe').getAttribute('src'),/^https:\/\/www.youtube-nocookie.com\/embed\/qlGek6xvJNg\?/);
  const report={passed:true,checkedAt:new Date().toISOString(),base,browser:'WebKit',checks,screenshots,intake,videoClickWorks:true,crmMutation:false};
  fs.writeFileSync(path.join(out,`${label}-visual.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
