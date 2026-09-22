import {assessmentLink} from './customer-action.mjs';
export const explainer = {
  id:'qlGek6xvJNg',
  title:'Get storage before it’s too late!! PROSPER',
  channel:'CRAIG STRATTON / @PROSPERShield',
  channelId:'UC1vyS6-ufQa-bpg-TgeaE6w',
  url:'https://www.youtube.com/watch?v=qlGek6xvJNg',
  duration:'5:40',
  published:'2026-09-13',
  checked:'2026-09-15',
  transcriptMethod:'English auto-generated captions, reviewed in full',
  embeddable:true
};
export function videoFeature(){return `<section class="watch-section" id="watch" aria-labelledby="watch-title"><div class="section-head"><div><p class="eyebrow">A quick explanation</p><h2 id="watch-title">Could a battery help your home?</h2></div></div><div class="watch-grid"><div><div class="video-stage" data-video-stage><button type="button" class="video-poster" data-video="${explainer.id}" aria-label="Play ${explainer.title}"><img src="/assets/prosper-storage-explainer.jpg" width="1280" height="720" loading="lazy" alt="Thumbnail from Prosper’s home battery explainer"><span class="play-disc" aria-hidden="true">▶</span><span class="video-duration">${explainer.duration}</span><span class="play-label">Play the explainer</span></button></div><p class="video-privacy">Loads from YouTube when you press play. <a href="${explainer.url}">Watch on YouTube ↗</a></p></div><div class="watch-copy"><span class="video-badge">PROSPER / VIDEO</span><h3>Start with the solar you already have.</h3><p>See why storage matters. Then let’s look at what makes sense for your home.</p>${assessmentLink('explainer')}<details class="video-context"><summary>Chapters &amp; context</summary><div class="video-chapters" aria-label="Explainer chapters"><a href="${explainer.url}&t=0s"><span>0:00</span> Why the bill can change ↗</a><a href="${explainer.url}&t=102s"><span>1:42</span> The problem with waiting ↗</a><a href="${explainer.url}&t=306s"><span>5:06</span> Start with your own numbers ↗</a></div><p>This is Prosper commentary, not a quote or a guarantee. Net-metering rules and grandfathering vary by utility; changes do not apply to every existing solar owner. Battery prices, installation timing, incentive eligibility and grid-service payments require a current property-level check.</p><p>Storage has losses and does not guarantee one-for-one bill credits or savings greater than financing costs. Historical battery-cell or pack cost declines are not installed home-system prices. Vogtle is a large-reactor project, not an SMR.</p><p>Use the <a href="/guides/fair-energy-comparisons/">cost comparison guide</a>, <a href="/guides/who-controls-your-power/">program contract checklist</a> and <a href="/guides/solar-performance/">solar-performance checklist</a> with the video.</p></details></div></div></section>`;}
