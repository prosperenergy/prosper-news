import {marked} from 'marked';

export const founderProfile = {
  slug: 'the-man-behind-the-prosper-method',
  title: 'The Man Behind the Prosper Method',
  dek: 'Craig Stratton on family, loss, a life in sales, and the responsibility of building something people can depend on.',
  topic: 'Prosper',
  kind: 'Founder interview',
  file: 'founder-profile.md',
  founderProfile: true,
  published: '2026-10-13',
  updated: '2026-10-13',
};

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const url = `/guides/${founderProfile.slug}/`;
const headingId = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const founderProfileFeature = `<header class="founder-profile-feature story-hero profile-lead" aria-labelledby="founder-profile-title">
  <div class="story-hero-media" aria-hidden="true"><img class="hero-day" src="/assets/prosper-home-day-20261013.webp" width="1536" height="1024" alt="" fetchpriority="high"><img class="hero-night" src="/assets/prosper-home-night-20261013.webp" width="1536" height="1024" alt=""></div>
  <div class="story-hero-copy">
    <p class="eyebrow">Latest interview · <time datetime="2026-10-13">October 13, 2026</time></p>
    <h1 id="founder-profile-title">The man behind<br>the Prosper<br>Method.</h1>
    <p class="story-standfirst">Family. Loss. Resilience. The people who shaped Craig Stratton, the story behind <em>Built Back Bold</em>, and the purpose driving Prosper’s next chapter.</p>
    <p class="story-byline">Craig Stratton <span>/</span> Founder &amp; CEO</p>
    <a class="button story-read" href="${url}">Read the interview <span aria-hidden="true">→</span></a>
  </div>
</header>`;

export const earlierFounderLetter = `<section class="earlier-founder-letter" aria-labelledby="earlier-letter-title">
  <div><p class="eyebrow">From the founder · October 4, 2026</p><h2 id="earlier-letter-title"><a href="/guides/be-the-one-they-follow/">Be the one they follow.</a></h2></div>
  <div><p>Craig’s earlier letter on earning trust, building leaders, and creating something people can count on.</p><a class="text-link" href="/guides/be-the-one-they-follow/">Read the letter <span aria-hidden="true">→</span></a></div>
</section>`;

export function founderProfileBody(article) {
  const copy = article.markdown.replace(/^# [^\n]+\n+## [^\n]+\n+\*[^\n]+\*\n+/, '');
  const headings = [];
  const content = marked.parse(copy).replace(/<h2>(.*?)<\/h2>/g, (_, label) => {
    const id = headingId(label);
    headings.push({id, label});
    return `<h2 id="${id}">${label}</h2>`;
  });
  return `<main id="main" class="shell founder-profile">
    <div class="breadcrumbs"><a href="/">Prosper News</a> / Founder interview</div>
    <header class="profile-header">
      <div>
        <p class="eyebrow">The people behind Prosper</p>
        <h1>${esc(article.title)}</h1>
        <p class="profile-dek">${esc(article.dek)}</p>
        <div class="meta"><span>Prosper News · Founder interview</span><time datetime="2026-10-13">October 13, 2026</time><span>${article.minutes} min read</span></div>
        <p class="profile-editor-note">Drawn from <em>Built Back Bold</em>, Craig’s résumé, recorded conversations, and written statements. Questions and first-person answers have been adapted and expanded for this profile.</p>
        <div class="share-row"><button type="button" data-copy-url="https://news.prospershield.io${url}">Copy link</button><button type="button" data-share>Share</button><button type="button" data-print>Print / save PDF</button><span class="share-status" role="status" aria-live="polite"></span></div>
      </div>
    </header>
    <div class="profile-reading">
      <aside class="profile-toc" aria-label="In this profile"><details><summary>Explore the conversation</summary><nav>${headings.map(h => `<a href="#${h.id}">${h.label}</a>`).join('')}</nav></details></aside>
      <article class="prose profile-prose">${content}<div class="profile-more"><a href="/guides/be-the-one-they-follow/">Read Craig’s earlier founder letter ↗</a><a href="/guides/prosper-opportunity-source-room/">Explore Prosper’s company history ↗</a></div></article>
    </div>
  </main>`;
}
