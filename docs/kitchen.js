import { EVENT, connect } from './fb.js?v=7';
import { unlockBell, ring } from './bell.js?v=7';
import { CHEESES, EXTRAS, burgerSummary, extrasList, esc } from './menu.js?v=7';
import { DEFAULTS, LABELS } from './cook.js?v=7';

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
              ${s.rows.filter((r) => r.items.length).map((r) => `<p><span class="k">${r.label}</span><span>${
                r.items.map((i) => esc(i.label) + (i.extra ? ' <b class="x">extra</b>' : '')).join(', ')}</span></p>`).join('')}
            </div>
          </section>`;
      }).join('')}
      ${extras.length ? `<ul class="extras">${extras.map((e) => `<li><b>${e.qty}×</b>${e.label}</li>`).join('')}</ul>` : ''}
      ${o.notes ? `<p class="note">${esc(o.notes)}</p>` : ''}
      <button class="orderup" data-done="${o.id}">Order up!</button>
    </article>`;
}

// Cheese slices one burger needs: one per patty; a double with both cheeses
// gets one of each; "extra" is one more slice of that cheese.
function cheeseSlices(b) {
  const chosen = CHEESES.filter((c) => b.cheese?.[c.id] && b.cheese[c.id] !== 'none');
  const patties = b.patties === 'double' ? 2 : 1;
  return chosen.map((c) => [c.label,
    (patties === 2 && chosen.length === 2 ? 1 : patties) + (b.cheese[c.id] === 'extra' ? 1 : 0)]);
}

// Everything on the open tickets, added up, so it can all go on at once.
// Anything at zero isn't mentioned.
function toCook(open) {
  if (!open.length) return '';
  let patties = 0;
  const cheese = new Map();
  const eggs = { runny: 0, hard: 0 };
  for (const o of open) {
    for (const b of o.burgers) {
      patties += b.qty * (b.patties === 'double' ? 2 : 1);
      for (const [label, n] of cheeseSlices(b)) cheese.set(label, (cheese.get(label) || 0) + b.qty * n);
      if (b.egg in eggs) eggs[b.egg] += b.qty;
    }
  }
  const chips = [
    patties && `<b class="big">${patties} ${patties === 1 ? 'patty' : 'patties'}</b>`,
    ...[...cheese].map(([label, n]) => `${n} ${label}`),
    eggs.runny && `${eggs.runny} runny ${eggs.runny === 1 ? 'egg' : 'eggs'}`,
    eggs.hard && `${eggs.hard} hard ${eggs.hard === 1 ? 'egg' : 'eggs'}`,
    ...EXTRAS.map((e) => [e.label, open.reduce((n, o) => n + (o.extras?.[e.id] || 0), 0)])
      .filter(([, n]) => n).map(([label, n]) => `${n} ${label}`),
  ].filter(Boolean);
  return `<div class="to-cook"><span class="lbl">To cook</span>${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>`;
}

// How long things take. Just reminders; nothing counts down.
function reminders() {
  const s = K.settings;
  const m = (sec) => `${Math.round((sec / 60) * 10) / 10} min`;
  const items = [
    s.fries && ['Fries', m(s.fries)],
    s.rings && ['Onion rings', m(s.rings)],
    (s.side1 || s.side2) && ['Patties', [s.side1 && m(s.side1), s.side2 && m(s.side2)].filter(Boolean).join(', flip, ')],
    s.runny && ['Runny egg', m(s.runny)],
    s.hard && ['Hard egg', m(s.hard)],
    s.onions && ['Onions', m(s.onions)],
  ].filter(Boolean);
  return `
    <footer class="reminders">
      ${items.map(([what, time]) => `<span class="rem"><span>${what}</span><b>${time}</b></span>`).join('')}
      <button class="gear" data-open="settings" aria-label="Change the reminders">⚙</button>
    </footer>`;
}

function settingsSheet() {
  return `
    <div class="sheet k-sheet" data-close>
      <div class="sheet-panel" role="dialog" aria-label="Timer reminders">
        <header><h2>Timer reminders</h2><button class="close" data-close aria-label="Close">✕</button></header>
        <div class="sheet-body">
          <p class="set-hint">Set one to 0 to hide it.</p>
          ${Object.keys(LABELS).map((k) => `
            <label class="set"><span>${LABELS[k]}</span>
              <input type="number" inputmode="decimal" min="0" step="0.5" data-setting="${k}" value="${K.settings[k] / 60}"><em>min</em></label>`).join('')}
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
    </header>
    ${K.error ? `<p class="k-error">${esc(K.error)}</p>` : ''}
    ${toCook(open)}
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
    ${reminders()}
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
  if (!(v >= 0)) return;
  K.settings[input.dataset.setting] = Math.round(v * 60);
  store.set(KEY.settings, K.settings);
});

setInterval(() => { if (K.started && !K.sheet) render(); }, 30000); // keep the "x min" ages fresh
render();
