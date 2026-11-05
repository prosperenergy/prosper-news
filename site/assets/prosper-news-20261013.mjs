const storageKey = 'prosper-news-theme';
const root = document.documentElement;
const toggle = document.querySelector('[data-theme-toggle]');
function applyTheme(theme, persist = false) {
  const night = theme === 'night';
  root.dataset.theme = night ? 'night' : 'day';
  document.querySelector(night ? '.hero-night' : '.hero-day')?.decode().catch(() => {});
  toggle?.setAttribute('aria-pressed', String(night));
  toggle?.setAttribute('aria-label', `Switch to ${night ? 'day' : 'night'} theme`);
  const label = toggle?.querySelector('[data-theme-label]');
  if (label) label.textContent = night ? 'Night' : 'Day';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#141414' : '#F9F4ED');
  if (persist) { try { localStorage.setItem(storageKey, root.dataset.theme); } catch {} }
}
applyTheme(root.dataset.theme);
toggle?.addEventListener('click', () => applyTheme(root.dataset.theme === 'night' ? 'day' : 'night', true));
window.addEventListener('storage', event => { if (event.key === storageKey) applyTheme(event.newValue); });
const menu = document.querySelector('.site-menu');
const summary = menu?.querySelector('summary');
const letterContents = document.querySelector('.founder-toc');
if (letterContents && matchMedia('(min-width:801px)').matches) letterContents.open = true;
menu?.addEventListener('toggle', () => summary?.setAttribute('aria-label', menu.open ? 'Close site menu' : 'Open site menu'));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.open) { menu.open = false; summary?.focus(); } });
document.addEventListener('click', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
