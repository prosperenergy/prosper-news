import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {articles,origin} from '../content/knowledge/catalog.mjs';
import {scaleModel,backupModel} from '../content/knowledge/calculators.mjs';
const base=process.argv[2],label=process.argv[3]||'preview';
assert(base?.startsWith('https://'));
const output='outputs/knowledge-base/brand-2026-09-15';
const routes=['/','/sources/','/about/',...articles.map(a=>`/guides/${a.slug}/`)];
const hash=b=>createHash('sha256').update(b).digest('hex');
const cache=new Map(),assets=new Set(['/assets/prosper-knowledge-base-share-20260915.jpg','/assets/prosper-bolt-favicon-official-64.png','/assets/kb-calculators.mjs']);
const links=new Set();
async function get(route){if(!cache.has(route)){const r=await fetch(new URL(route,base),{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,route);cache.set(route,Buffer.from(await r.arrayBuffer()));}return cache.get(route);}
for(const route of routes){const bytes=await get(route),html=bytes.toString();assert.equal(hash(bytes),hash(fs.readFileSync(path.join('site',route,'index.html'))),route);assert(html.includes(`href="${origin+route}"`));assert(html.includes(origin+'/assets/prosper-knowledge-base-share-20260915.jpg'));assert.equal((html.match(/<h1[ >]/g)||[]).length,1);for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(url.startsWith('/assets/'))assets.add(url);else if(url.startsWith('/')||url.startsWith('#'))links.add(new URL(url,new URL(route,base)).href);}}
for(const url of links){const u=new URL(url);const body=(await get(u.pathname)).toString();if(u.hash)assert(body.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`),url);}
for(const asset of assets){assert.equal(hash(await get(asset)),hash(fs.readFileSync(path.join('site',asset))),asset);}
for(const route of ['/feed.xml','/sitemap.xml','/robots.txt','/archive/solar-is-the-smarter-bet/','/news/','/news/mini-nuclear-is-a-promise/','/mini-nuclear-is-a-promise/','/solar-is-the-smarter-bet/'])await get(route);
assert.equal(scaleModel({homes:5.82,adoption:50,kwh:13.5,price:15647,months:36}).gwh,39.285);
assert.equal(backupModel({kwh:13.5,charge:100,reserve:20,load:1}).hours,10.8);
assert.throws(()=>backupModel({kwh:13.5,charge:100,reserve:20,load:0}));
const report={passed:true,checkedAt:new Date().toISOString(),base,routes:routes.length,internalLinks:links.size,assets:assets.size,exactDeployedHtml:true,assetHashesMatch:true,modelsPassed:true};
fs.writeFileSync(`${output}/${label}-http.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
