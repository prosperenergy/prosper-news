import {scaleModel,backupModel} from './calculators.mjs';
const number=(v,d=0)=>v.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:d});
// Keep existing deep links useful when optional research is collapsed.
function revealHashTarget(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);if(!target)return;
  if(target.matches('details'))target.open=true;
  let parent=target.parentElement;
  while(parent){if(parent.matches('details'))parent.open=true;parent=parent.parentElement;}
}
revealHashTarget();
window.addEventListener('hashchange',revealHashTarget);
// One visible mobile action is enough; do not cover the hero or repeat the end CTA.
if('IntersectionObserver' in window){
  const visible=new Set();
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)entry.isIntersecting?visible.add(entry.target):visible.delete(entry.target);
    document.body.classList.toggle('cta-in-view',visible.size>0);
  },{threshold:0.5});
  document.querySelectorAll('[data-news-cta]:not([data-news-cta="mobile-bar"])').forEach(link=>observer.observe(link));
}
for(const area of document.querySelectorAll('[data-search-area]')){
  const input=area.querySelector('[data-search]'),items=[...area.querySelectorAll('[data-search-item]')],status=area.querySelector('[data-results-status]'),empty=area.querySelector('[data-no-results]');let topic='';
  function update(){const terms=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);let count=0;for(const item of items){const match=(!topic||item.dataset.topic===topic)&&terms.every(t=>item.dataset.searchText.includes(t));item.hidden=!match;if(match)count++;}status.textContent=`${count} of ${items.length} ${area.dataset.searchArea} shown${topic?' · '+topic:''}`;if(empty)empty.hidden=count!==0;}
  input.addEventListener('input',update);
  area.querySelectorAll('[data-topic-filter]').forEach(button=>button.addEventListener('click',()=>{topic=button.dataset.topicFilter;area.querySelectorAll('[data-topic-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
  area.querySelector('[data-reset]')?.addEventListener('click',()=>{input.value='';topic='';area.querySelectorAll('[data-topic-filter]').forEach(b=>b.setAttribute('aria-pressed',String(!b.dataset.topicFilter)));update();input.focus();});update();
}
async function copy(text,status){try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}catch{status.textContent='Copy is unavailable in this browser. Select and copy the page address or text directly.';}}
document.querySelectorAll('[data-copy-url]').forEach(b=>b.addEventListener('click',()=>copy(b.dataset.copyUrl,b.parentElement.querySelector('[role=status]'))));
document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.video;
  if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
  const frame=document.createElement('iframe');
  frame.title='Prosper explainer: Get storage before it’s too late';
  const start=Number(button.dataset.videoStart),end=Number(button.dataset.videoEnd);
  const clip=Number.isFinite(start)?`&start=${Math.max(0,Math.round(start))}${Number.isFinite(end)?`&end=${Math.max(Math.round(start)+1,Math.round(end))}`:''}`:'';
  frame.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}${clip}`;
  frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen=true;
  frame.referrerPolicy='strict-origin-when-cross-origin';
  button.closest('[data-video-stage]').replaceChildren(frame);
  frame.focus();
}));
document.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click',async()=>{const status=b.parentElement.querySelector('[role=status]');const url=document.querySelector('link[rel=canonical]').href;try{if(navigator.share){await navigator.share({title:document.title,url});status.textContent='Share sheet completed.';}else{await copy(url,status);}}catch(e){status.textContent=e.name==='AbortError'?'Sharing canceled.':'Sharing is unavailable. Use Copy link.';}}));
for(const form of document.querySelectorAll('[data-calculator]')){
  const kind=form.dataset.calculator,error=form.querySelector('[data-calc-error]'),result=form.querySelector('[data-calc-results]'),status=form.querySelector('[data-copy-status]');let summary='';
  function update(){try{const values=Object.fromEntries([...form.querySelectorAll('input')].map(i=>[i.name,i.value.trim()===''?NaN:Number(i.value)]));if(kind==='scale'){const r=scaleModel(values);result.innerHTML=`<strong>${number(r.gwh,3)} GWh usable storage</strong>${number(r.installations)} new batteries · US$${number(r.billions,3)} billion<br>${number(r.monthly)} installations / month over ${number(values.months)} months`;summary=`Scenario: ${values.homes} million residential solar installations; ${values.adoption}% add ${values.kwh} kWh at US$${values.price} each over ${values.months} months. Result: ${number(r.installations)} batteries, ${number(r.gwh,3)} GWh, US$${number(r.billions,3)} billion, ${number(r.monthly)} installs/month. Assumptions, not a forecast or a quote; storage is not generation.`;}else{const r=backupModel(values);result.innerHTML=`<strong>${number(r.hours,2)} hours — idealized ceiling</strong>${number(r.available,2)} kWh available above reserve<br>Does not verify inverter output, startup loads or future recharging.`;summary=`Idealized backup ceiling: ${number(r.hours,2)} hours from ${values.kwh} usable AC kWh, ${values.charge}% initial charge, ${values.reserve}% reserve, ${values.load} kW average load. Not guaranteed runtime; excludes additional losses, temperature, degradation, changing loads and future recharging; output limits must be checked.`;}error.hidden=true;result.hidden=false;form.querySelector('[data-copy-result]').disabled=false;status.textContent='';}catch(e){summary='';error.textContent=e.message;error.hidden=false;result.hidden=true;form.querySelector('[data-copy-result]').disabled=true;status.textContent='';}}
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',update);form.querySelector('[data-calc-reset]').addEventListener('click',()=>{form.reset();update();});form.querySelector('[data-copy-result]').addEventListener('click',()=>copy(summary+' '+document.querySelector('link[rel=canonical]').href,status));update();
}
