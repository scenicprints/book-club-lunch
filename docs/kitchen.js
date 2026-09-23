import { EVENT, connect } from './fb.js?v=6';
import { unlockBell, ring } from './bell.js?v=6';
import { burgerSummary, extrasList, esc } from './menu.js?v=6';
import { DEFAULTS, TIMER_LABELS } from './cook.js?v=6';
import { setPresets } from './timers.js?v=6';

const app = document.getElementById('app');
const IS_TEST = EVENT !== 'book-club-lunch-2026-09-26';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const KEY = { settings: 'kitchen:settings' };

const K = {
  started: false,
  loaded: false,
  offline: false,
  error: '',
  orders: [],
  seen: new Set(),
  fresh: new Set(), // tickets that just arrived, swung onto the rail
  settings: { ...DEFAULTS, ...store.get(KEY.settings, {}) },
  sheet: null,      // 'settings' while the timer lengths are open
};
let fs;
let ordersRef;

const presets = () => Object.keys(TIMER_LABELS).map((k) => [TIMER_LABELS[k], K.settings[k]]);
setPresets(presets());

connect().then((c) => {
  ({ fs } = c);
  ordersRef = c.orders;
  fs.onSnapshot(ordersRef, { includeMetadataChanges: true }, (snap) => {
    K.offline = snap.metadata.fromCache;
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    let arrived = false;
    for (const o of list) {
      if (K.loaded && !K.seen.has(o.id)) {
        arrived = true;
        K.fresh.add(o.id);
        setTimeout(() => { K.fresh.delete(o.id); render(); }, 6000);
      }
      K.seen.add(o.id);
    }
    if (arrived) ring();
    K.orders = list;
    K.loaded = true;
    render();
  }, () => { K.error = 'Lost the connection to orders. Reload the page.'; render(); });
}).catch(() => { K.error = "Can't reach the order system. Check the Wi-Fi and reload."; render(); });

// Keep the iPad from sleeping while the kitchen is open.
async function stayAwake() {
  try { await navigator.wakeLock?.request('screen'); } catch { /* not supported */ }
}
document.addEventListener('visibilitychange', () => {
  if (K.started && document.visibilityState === 'visible') stayAwake();
});

const ago = (ms) => {
  const m = Math.floor((Date.now() - ms) / 60000);
  return m < 1 ? 'just now' : `${m} min`;
};
const clock = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function ticket(o, number) {
  const extras = extrasList(o.extras);
  return `
    <article class="ticket ${K.fresh.has(o.id) ? 'fresh' : ''}">
      <header>
        <span class="num">#${number}</span>
        <h2>${esc(o.name)}</h2>
        <span class="age">${ago(o.createdMs)}</span>
      </header>
      ${o.burgers.map((b) => {
        const s = burgerSummary(b);
        return `
          <section class="tb">
            <div class="q">${b.qty}×</div>
            <div>
              <h3>${s.title}</h3>
              ${s.rows.map((r) => `<p><span class="k">${r.label}</span><span>${r.items.length
                ? r.items.map((i) => esc(i.label) + (i.extra ? ' <b class="x">extra</b>' : '')).join(', ')
                : `<i>${r.none}</i>`}</span></p>`).join('')}
            </div>
          </section>`;
      }).join('')}
      ${extras.length ? `<ul class="extras">${extras.map((e) => `<li><b>${e.qty}×</b>${e.label}</li>`).join('')}</ul>` : ''}
      ${o.notes ? `<p class="note">${esc(o.notes)}</p>` : ''}
      <button class="orderup" data-done="${o.id}">Order up!</button>
    </article>`;
}

function settingsSheet() {
  return `
    <div class="sheet k-sheet" data-close>
      <div class="sheet-panel" role="dialog" aria-label="Timer lengths">
        <header><h2>Timer lengths</h2><button class="close" data-close aria-label="Close">✕</button></header>
        <div class="sheet-body">
          ${Object.keys(TIMER_LABELS).map((k) => `
            <label class="set"><span>${TIMER_LABELS[k]}</span>
              <input type="number" inputmode="decimal" min="0.5" step="0.5" data-setting="${k}" value="${K.settings[k] / 60}"><em>min</em></label>`).join('')}
        </div>
        <footer><button class="primary" data-close>Done</button></footer>
      </div>
    </div>`;
}

function render() {
  if (!K.started) {
    app.innerHTML = `
      <div class="k-start"><div class="panel">
        <div class="sign"><div class="board">
          <p class="kicker">Book Club Lunch</p>
          <h1 class="neon">Kitchen</h1>
        </div></div>
        <p>Every order a guest sends lands here as a ticket.</p>
        <button class="primary" data-start>Open the kitchen</button>
        <p class="fine">Turns on the new-order bell and keeps the screen awake.</p>
        ${IS_TEST ? `<p class="fine"><b>Test event:</b> ${esc(EVENT)}</p>` : ''}
      </div></div>`;
    return;
  }
  // Numbered in the order they came in, so "#4" means the same ticket all day.
  const byTime = [...K.orders].sort((a, b) => a.createdMs - b.createdMs);
  const number = new Map(byTime.map((o, n) => [o.id, n + 1]));
  const open = byTime.filter((o) => o.status !== 'ready');
  const done = byTime.filter((o) => o.status === 'ready').sort((a, b) => (b.readyMs || 0) - (a.readyMs || 0));

  app.innerHTML = `
    <header class="k-top">
      <h1 class="neon">Kitchen</h1>
      <span class="count">${open.length ? `${open.length} to make` : 'All caught up'}</span>
      ${K.offline ? '<span class="flag">Offline. Waiting for Wi-Fi…</span>' : ''}
      ${IS_TEST ? `<span class="flag">Test: ${esc(EVENT)}</span>` : ''}
      <button class="gear" data-open="settings" aria-label="Timer lengths">⚙</button>
    </header>
    ${K.error ? `<p class="k-error">${esc(K.error)}</p>` : ''}
    ${open.length
      ? `<div class="rail"><div class="grid">${open.map((o) => ticket(o, number.get(o.id))).join('')}</div></div>`
      : `<p class="empty">${K.loaded ? 'No orders on the rail. The bell rings when one comes in.' : 'Connecting…'}</p>`}
    ${done.length ? `
      <section class="done-list">
        <h2>Order up</h2>
        ${done.map((o) => `
          <div class="done-row">
            <span class="num">#${number.get(o.id)}</span>
            <b>${esc(o.name)}</b>
            <span>${o.readyMs ? clock(o.readyMs) : ''}</span>
            <button data-undo="${o.id}">Put back</button>
          </div>`).join('')}
      </section>` : ''}
    ${K.sheet === 'settings' ? settingsSheet() : ''}`;
  document.body.classList.toggle('locked', !!K.sheet);
}

app.addEventListener('click', (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;
  if (t('[data-start]')) {
    unlockBell();
    stayAwake();
    K.started = true;
    document.body.classList.add('started');
  } else if ((el = t('[data-open]'))) {
    K.sheet = el.dataset.open;
  } else if ((el = t('[data-close]'))) {
    if (el.classList.contains('k-sheet') && e.target !== el) return; // a tap inside the panel
    K.sheet = null;
  } else if ((el = t('[data-done]'))) {
    fs.updateDoc(fs.doc(ordersRef, el.dataset.done), { status: 'ready', readyMs: Date.now() });
    return;
  } else if ((el = t('[data-undo]'))) {
    fs.updateDoc(fs.doc(ordersRef, el.dataset.undo), { status: 'new' });
    return;
  } else {
    return;
  }
  render();
});

app.addEventListener('change', (e) => {
  const input = e.target.closest('[data-setting]');
  if (!input) return;
  const v = Number(input.value);
  if (!(v > 0)) return;
  K.settings[input.dataset.setting] = Math.round(v * 60);
  store.set(KEY.settings, K.settings);
  setPresets(presets());
});

setInterval(() => { if (K.started && !K.sheet) render(); }, 30000); // keep the "x min" ages fresh
render();
