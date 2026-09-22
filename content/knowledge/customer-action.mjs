// Use Prosper's existing live assessment intake. This page does not collect data.
export const assessmentURL = 'https://prospershield.io/join/?utm_source=prosper-news&utm_medium=website&utm_campaign=free-system-check';

export function assessmentLink(placement, label = 'Request My Free System Check', className = 'button') {
  return `<a class="${className}" data-news-cta="${placement}" href="${assessmentURL}&amp;utm_content=${placement}">${label}<span aria-hidden="true">↗</span></a>`;
}

export const customerCTA = `<section class="cta" id="system-check" aria-labelledby="system-check-title"><div class="shell"><div><p class="eyebrow">Start with your home</p><h2 id="system-check-title">You paid for solar.<br>Let’s check it’s doing its job.</h2><p>Request a free assessment. We’ll help you understand your system and what to do next.</p></div><div class="cta-action">${assessmentLink('page-end')}<p class="cta-reassurance">Free assessment. No obligation to buy.</p></div></div></section>`;

export const mobileAction = `<div class="mobile-action" aria-label="Request a free system check">${assessmentLink('mobile-bar')}</div>`;

export const articleAction = `<div class="article-action"><span>What does this mean for your home?</span>${assessmentLink('article-intro', 'Get a Free System Check', 'article-action-link')}</div>`;
