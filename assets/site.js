const ROOT = document.body.dataset.root || './';

// Tabs: one view at a time.
function showTab(box, name) {
  const btn = box && box.querySelector(`[data-tab="${name}"]`);
  if (!btn) return;
  box.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
  box.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tabs] [data-tab]');
  if (btn) showTab(btn.closest('[data-tabs]'), btn.dataset.tab);
});

// The collection sub-tabs and the price chips narrow the list together.
function filter() {
  const list = document.querySelector('[data-list]');
  if (!list) return;
  const c = document.querySelector('[data-filter="coll"] [aria-selected="true"]');
  const b = document.querySelector('[data-bands] [aria-pressed="true"]');
  const coll = c ? c.dataset.sub : '';
  const band = b ? b.dataset.band : '';
  let shown = 0;
  for (const li of list.children) {
    const hit = (!coll || li.dataset.coll === coll) && (!band || li.dataset.band === band);
    li.hidden = !hit;
    if (hit) shown += 1;
  }
  const none = document.querySelector('[data-none]');
  if (none) none.hidden = shown > 0;
}
function pickColl(key) {
  const bar = document.querySelector('[data-filter="coll"]');
  if (!bar) return;
  bar.querySelectorAll('[data-sub]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.sub === key)));
  showTab(document.querySelector('[data-tabs]'), 'coll');
  filter();
}
document.addEventListener('click', (e) => {
  const sub = e.target.closest('[data-filter="coll"] [data-sub]');
  if (sub) { pickColl(sub.dataset.sub); return; }
  const band = e.target.closest('[data-bands] [data-band]');
  if (band) { band.parentElement.querySelectorAll('[data-band]').forEach((x) => x.setAttribute('aria-pressed', String(x === band))); filter(); }
});

// #c-khaddar opens that collection.
function openFromLocation() {
  const m = location.hash.match(/^#c-([a-z0-9-]+)$/);
  if (m && document.querySelector('[data-list]')) { pickColl(m[1]); document.getElementById('shop').scrollIntoView({ block: 'start' }); }
}
window.addEventListener('hashchange', openFromLocation);
document.addEventListener('DOMContentLoaded', openFromLocation);

// Header search over assets/search.json.
document.addEventListener('DOMContentLoaded', () => {
  const box = document.querySelector('[data-find]');
  const list = document.querySelector('[data-found]');
  if (!box) return;
  let index = null;
  let pos = -1;
  const load = () => index || (index = fetch(`${ROOT}assets/search.json`).then((r) => r.json()).catch(() => []));
  async function update() {
    const words = box.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { list.hidden = true; return; }
    const hits = (await load()).filter((h) => words.every((w) => h.q.includes(w))).slice(0, 12);
    list.innerHTML = '';
    pos = -1;
    if (!hits.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nothing matches that search.'; list.append(li); }
    for (const h of hits) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = ROOT + h.u;
      a.textContent = h.t;
      const k = document.createElement('small');
      k.textContent = h.k;
      a.append(k);
      li.append(a);
      list.append(li);
    }
    list.hidden = false;
  }
  box.addEventListener('focus', load);
  box.addEventListener('input', update);
  box.addEventListener('keydown', (e) => {
    const links = [...list.querySelectorAll('a')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!links.length) return;
      pos = (pos + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('on', i === pos));
    } else if (e.key === 'Enter' && links.length) { location.href = links[Math.max(pos, 0)].href; }
    else if (e.key === 'Escape') list.hidden = true;
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.find')) list.hidden = true; });
});
