// One-time, mechanical replacement of the September 14 teal theme with verified Prosper tokens.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const cssPath='content/knowledge/site.css',buildPath='scripts/build-knowledge-base.mjs';
let css=fs.readFileSync(cssPath,'utf8');
const colors={
  '#132323':'#141414','#4c6564':'#555555','#006f72':'#0b5cff','#6be0ce':'#f4ff00',
  '#f5f5ef':'#f9f4ed','#cfdbd5':'#d8d4cf','#092e30':'#141414','#b46000':'#0746c4',
  '#386061':'#d8d4cf','#587372':'#d8d4cf','#edf8f4':'#ffffff','#bcd3ce':'#ffffff',
  '#a6bbb4':'#a7a7a7','#bac9c3':'#777777','#c2d9d3':'#ffffff','#52726f':'#f4ff00',
  '#b5d2ca':'#ffffff','#d9eee5':'#f4ff00','#bdd3ce':'#d8d8d8','#e6f8f2':'#ffffff',
  '#355753':'#555555','#e4eee7':'#edf2ff','#eaf0e9':'#f9f4ed','#9ddccc':'#d8e4ff',
  '#e7eee8':'#edf2ff','#385951':'#0746c4','#e6eee7':'#edf2ff','#b0c8bd':'#c2cfe8',
  '#8ea89d':'#8c8c8c','#a02c10':'#a02c10','#fff2ca':'#f9f4ed'
};
for(const [from,to] of Object.entries(colors))css=css.replaceAll(from,to);
css=css.replaceAll('--teal','--blue').replaceAll('rgba(0,23,23,.95)','rgba(20,20,20,.96)');
fs.writeFileSync(cssPath,css);
let b=fs.readFileSync(buildPath,'utf8');
assert(b.includes("const dateLabel='September 14, 2026'"),'This migration is for the September 14 builder only.');
b=b.replace("import fs from 'node:fs';","import fs from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {videoFeature} from '../content/knowledge/explainer.mjs';");
b=b.replace("save('assets/kb-'+name,","save('assets/'+(name==='site.css'?'kb-site-20260915.css':name==='site.mjs'?'kb-site-20260915.mjs':'kb-'+name),");
b=b.replace("const dateLabel='September 14, 2026';",`const dateLabel='September 15, 2026';
const brandSource=path.join(root,'source/brand-2026-09-15');
const brandLock=JSON.parse(fs.readFileSync(path.join(brandSource,'brand-lock.json'),'utf8'));
for(const [file,expected] of [['prosper-wordmark-official.png',brandLock.assets.wordmark.sha256],['prosper-bolt-favicon-official.png',brandLock.assets.favicon.sha256]]){
 const bytes=fs.readFileSync(path.join(brandSource,file));
 if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Official brand asset hash mismatch: '+file);
 save('assets/'+file,bytes);
}
for(const file of ['prosper-wordmark-official-header.webp','prosper-bolt-favicon-official-64.png'])save('assets/'+file,fs.readFileSync(path.join(brandSource,file)));
save('assets/prosper-storage-explainer.jpg',fs.readFileSync(path.join(root,'source/prosper-storage-explainer-qlGek6xvJNg.jpg')));`);
b=b.replaceAll('/assets/kb-site.css','/assets/kb-site-20260915.css').replaceAll('/assets/kb-site.mjs','/assets/kb-site-20260915.mjs');
b=b.replaceAll('66f5bf329b5d51bd.webp','prosper-wordmark-official-header.webp');
b=b.replaceAll('prosper-knowledge-base-share.jpg','prosper-knowledge-base-share-20260915.jpg');
b=b.replaceAll('/assets/prosper-favicon.png','/assets/prosper-bolt-favicon-official-64.png');
b=b.replace('content="#092e30"','content="#0b5cff"').replaceAll('style="color:#9aebd7"','style="color:#f4ff00"');
b=b.replace("${nav('/#library','The guides',current)}${nav('/#tools','The calculators',current)}${nav('/sources/','The sources',current)}${nav('/about/','Our standpoint',current)}","${nav('/#library','The guides',current)}${nav('/#watch','Watch',current)}${nav('/#tools','The calculators',current)}${nav('/sources/','The sources',current)}");
b=b.replace('<div class="footer-brand">POWERING MORE THAN YOUR HOME.</div>','<a href="/" aria-label="Prosper News home"><img class="footer-wordmark" src="/assets/prosper-wordmark-official-header.webp" width="134" height="58" alt="Prosper"></a><div class="footer-brand">POWERING MORE THAN YOUR HOME.</div>');
b=b.replace('<section class="library" id="library"','${videoFeature()}<section class="library" id="library"');
b=b.replace('Sharing uses your browser’s clipboard or share sheet and sends nothing automatically.','Sharing uses your browser’s clipboard or share sheet and sends nothing automatically. The YouTube player is loaded only when you choose to play the explainer; YouTube then receives the playback request and applies its own privacy terms. A direct YouTube link remains available.');
b=b.replaceAll('#fff2ca','#f9f4ed').replaceAll('#172626','#141414').replaceAll('#006f72','#0b5cff');
// The social card follows the light Prosper palette, with a blue headline and yellow accent.
b=b.replaceAll('background:#092e30;color:white','background:#f9f4ed;color:#141414').replaceAll('linear-gradient(90deg,#092e30 51%,transparent)','linear-gradient(90deg,#f9f4ed 54%,rgba(249,244,237,.2))');
b=b.replaceAll('#5e8782','#b7b0a7').replaceAll('#6be0ce','#0b5cff').replaceAll('#cfdfd8','#141414').replaceAll('#547470','#0b5cff').replaceAll('#b7c9c1','#141414');
b=b.replace('.photo{position:absolute;right:0;top:0;width:480px;height:630px;object-fit:cover;opacity:.55}', '.photo{position:absolute;right:0;top:0;width:430px;height:630px;object-fit:cover;opacity:.8}');
b=b.replace('em{color:#0b5cff;font-style:normal}','em{color:#0b5cff;font-style:normal;text-decoration:underline;text-decoration-color:#f4ff00;text-decoration-thickness:8px;text-underline-offset:12px}');
b=b.replace('.micro{position:absolute;right:15px;bottom:8px;font-size:9px;color:#141414}', '.micro{position:absolute;right:15px;bottom:8px;font-size:9px;color:white;background:#141414;padding:3px 5px}');
b=b.replace("// Produce favicon from the supplied Prosper logo, preserving all original assets.\nconst sharp=require('sharp');await sharp(path.join(out,'assets/prosper-wordmark-official-header.webp')).resize(64,64,{fit:'contain',background:'#092e30'}).png().toFile(path.join(out,'assets/prosper-favicon.png'));",'// Official bolt favicon is copied unchanged from the verified brand asset set above.');
assert(!b.includes('resize(64,64'),'Do not regenerate an improvised favicon.');
assert(b.includes('${videoFeature()}'),'Video insertion failed');
fs.writeFileSync(buildPath,b);
console.log('Applied verified Prosper palette, official artwork, cache-versioned assets and explainer slot.');
