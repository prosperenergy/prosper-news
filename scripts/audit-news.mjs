import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('/Users/craigstratton/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const root=path.resolve(import.meta.dirname,'..');
const base=process.argv[2]||'https://news.prospershield.io/';
const label=process.argv[3]||'audit-before';
const out=path.join(root,'outputs',label);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={url:base,checkedAt:new Date().toISOString(),viewports:[],external:[],controls:{}};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>null)));});
  const links=await page.locator('a').evaluateAll(as=>as.map(a=>({text:a.innerText.trim(),href:a.getAttribute('href'),url:a.href})));
  report.anchorCount=links.length;
  report.links=links;
  const external=[...new Set(links.filter(a=>a.url.startsWith('https://')&&new URL(a.url).origin!==new URL(base).origin).map(a=>a.url))];
  let cursor=0;
  await Promise.all(Array.from({length:6},async()=>{
    while(cursor<external.length){const url=external[cursor++];let entry={url};try{
      const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(16000)});
      entry={...entry,status:r.status,finalUrl:r.url,type:r.headers.get('content-type')};
      if(entry.type?.includes('text/html')){const h=await r.text();entry.title=h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();entry.challenge=/Just a moment|Access Denied|Checking your browser|Verify you are human/i.test(entry.title||'');}
      else await r.arrayBuffer();
    }catch(e){entry.error=e.cause?.code||e.message;} report.external.push(entry);}
  }));
  console.log(JSON.stringify({stage:'http-links',count:report.external.length,needsBrowser:report.external.filter(e=>e.status!==200||e.challenge)},null,2));
  fs.writeFileSync(path.join(out,'links-http.json'),JSON.stringify(report.external,null,2));
  for(const width of [1440,1024,768,390,320]){
    await page.setViewportSize({width,height:1000});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(out,`${width}-hero.png`)});
    const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,headerHeight:document.querySelector('.topbar').getBoundingClientRect().height,newsLabelVisible:[...document.querySelectorAll('.brand span,.brand-news')].some(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none'),brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),badAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href')),fontBody:getComputedStyle(document.body).fontFamily,background:getComputedStyle(document.body).backgroundColor,smallControls:[...document.querySelectorAll('button,.toplinks a,.share-link,.home-plan-card a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).map(e=>({text:e.innerText,height:e.getBoundingClientRect().height}))}));
    report.viewports.push(state);
    if(width===1440||width===390){
      for(const selector of ['.intro','#system-check','#section-0','#section-5','#videos','#sources','#next-step','.footer']){
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(out,`${width}-${selector.replace(/[^a-z0-9-]/gi,'')}.png`)});
      }
    }
  }
  await page.setViewportSize({width:390,height:1000});
  await page.locator('.mobile-toc summary').click();
  report.controls.mobileTocOpen=await page.locator('.mobile-toc').getAttribute('open')!==null;
  await page.locator('.mobile-toc a[href="#section-5"]').click();
  report.controls.mobileTocDestination=await page.evaluate(()=>location.hash);
  await page.evaluate(()=>{window.__printInvoked=false;window.print=()=>window.__printInvoked=true;});
  await page.locator('.print-link').click();
  report.controls.printButton=await page.evaluate(()=>window.__printInvoked);
  const videos=await page.locator('[data-video]').evaluateAll(bs=>bs.map(b=>({id:b.dataset.video,label:b.getAttribute('aria-label')})));
  report.controls.videos=[];
  for(const video of videos){
    const button=page.locator(`[data-video="${video.id}"]`);await button.click();
    await page.waitForFunction(id=>!!document.querySelector(`iframe[src*="${id}"]`),video.id);
    report.controls.videos.push({...video,iframe:await page.locator(`iframe[src*="${video.id}"]`).getAttribute('src')});
  }
  report.controls.pageErrors=errors;
  await page.close();
  for(const entry of report.external.filter(e=>e.status!==200||e.challenge)){
    const p=await browser.newPage({viewport:{width:1280,height:900}});
    try{const r=await p.goto(entry.url,{waitUntil:'domcontentloaded',timeout:15000});await p.waitForTimeout(800);entry.browser={status:r?.status(),finalUrl:p.url(),title:await p.title(),text:(await p.locator('body').innerText()).replace(/\s+/g,' ').slice(0,750)};}catch(e){entry.browser={error:e.message.split('\n')[0]};}
    await p.close();
  }
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({stage:'complete',anchorCount:report.anchorCount,externalCount:report.external.length,viewports:report.viewports,controls:report.controls,externalExceptions:report.external.filter(e=>e.status!==200||e.challenge),report:path.join(out,'audit.json')},null,2));
}finally{await browser.close();}
