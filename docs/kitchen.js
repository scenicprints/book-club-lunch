import { EVENT, connect } from './fb.js?v=20';
import { unlockBell, ring } from './bell.js?v=20';
import { CHEESES, EXTRAS, STOCK, burgerSummary, extrasList, esc, placedAt } from './menu.js?v=20';
import { REMINDERS } from './cook.js?v=20';

// One screen, no scrolling: patties to cook along the top, tickets across the
// middle, heat-and-time reminders along the bottom.

const app = document.getElementById('app');
const IS_TEST = EVENT !== 'book-club-lunch-2026-09-26';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const KEY = { reminders: 'kitchen:reminders' };

const K = {
  started: false,
  loaded: false,
  offline: false,
  error: '',
  orders: [],
  seen: new Set(),
  fresh: new Set(), // tickets that just arrived, swung onto the rail
  reminders: store.get(KEY.reminders, {}), // id -> { temp, time } edits
  sheet: null,      // 'settings' | 'soldout' | 'close'
  kitchen: { soldOut: {}, closed: false }, // shared with every guest's phone
};
let fs;
let ordersRef;
let stateRef;

connect().then((c) => {
  ({ fs } = c);
  ordersRef = c.orders;
  stateRef = c.state;
  fs.onSnapshot(stateRef, (snap) => {
    K.kitchen = { soldOut: {}, closed: false, ...snap.data() };
    render();
  });
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

// ---------- patties (top rail) ----------

// The cheese on each patty of a burger, bottom patty first. One slice per
// patty; a double with both cheeses gets one of each; "extra" is one more
// slice of that cheese.
function pattyCheese(b) {
  const chosen = CHEESES.filter((c) => b.cheese?.[c.id] && b.cheese[c.id] !== 'none');
  const per = Array.from({ length: b.patties === 'double' ? 2 : 1 }, () => []);
  if (per.length === 2 && chosen.length === 2) {
    per[0].push(chosen[0].id);
    per[1].push(chosen[1].id);
  } else {
    for (const p of per) for (const c of chosen) p.push(c.id);
  }
  for (const c of chosen) {
    if (b.cheese[c.id] === 'extra') {
      for (let i = per.length - 1; i >= 0; i--) if (per[i].includes(c.id)) { per[i].push(c.id); break; }
    }
  }
  return per;
}

// Every patty on tickets not yet on the griddle, grouped by the cheese it gets.
function pattyRail(open) {
  const groups = new Map(); // "gruyere+cheddar" -> { slices, n }
  for (const o of open) {
    if (o.cooking) continue;
    for (const b of o.burgers || []) {
      for (const slices of pattyCheese(b)) {
        const key = slices.join('+') || 'plain';
        const g = groups.get(key) || { slices, n: 0 };
        g.n += b.qty;
        groups.set(key, g);
      }
    }
  }
  const list = [...groups.values()].sort((a, b) => b.n - a.n);
  const total = list.reduce((n, g) => n + g.n, 0);
  const name = (id) => CHEESES.find((c) => c.id === id)?.label || id;
  return `
    <div class="patty-rail">
      <div class="pr-count"><b>${total}</b><span>${total === 1 ? 'patty' : 'patties'}<br>to cook</span></div>
      <div class="pr-chips">
        ${list.length ? list.map((g) => `
          <span class="pchip">
            <b>${g.n}×</b>
            ${g.slices.length
              ? g.slices.map((id) => `<i class="slice ${id}">${name(id)}</i>`).join('<em>+</em>')
              : '<i class="slice plain">No cheese</i>'}
          </span>`).join('')
        : `<span class="pr-none">${open.some((o) => o.cooking) ? 'Everything is on the griddle.' : 'Nothing waiting.'}</span>`}
      </div>
      ${total ? '<button class="griddle-btn" data-cooking>On the griddle ✓</button>' : ''}
    </div>`;
}

// ---------- tickets (middle) ----------

// A ticket's edge turns amber at 10 minutes and red at 15, so a forgotten one stands out.
function ageClass(o) {
  const m = (Date.now() - placedAt(o)) / 60000;
  return m >= 15 ? 'late' : m >= 10 ? 'waiting' : '';
}

function ticket(o, number) {
  const extras = extrasList(o.extras);
  return `
    <div class="hang">
      <article class="ticket ${K.fresh.has(o.id) ? 'fresh' : ''} ${ageClass(o)}">
        <header>
          <span class="num">#${number}</span>
          <h2>${esc(o.name)}</h2>
          <span class="age">${ago(placedAt(o))}</span>
        </header>
        <div class="t-body">
        ${o.cooking ? `<button class="fire" data-uncook="${o.id}" aria-label="Not on the griddle yet">🔥 On the griddle</button>` : ''}
        ${(o.burgers || []).map((b) => {
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
        </div>
        <button class="orderup" data-done="${o.id}">Order up!</button>
      </article>
    </div>`;
}

// ---------- reminders (bottom rail) ----------

const reminder = (r) => ({ ...r, ...K.reminders[r.id] });

function reminderRail() {
  const items = REMINDERS.map(reminder).filter((r) => r.temp || r.time);
  return `
    <footer class="reminders">
      ${items.map((r) => `
        <span class="rem"><span>${esc(r.label)}</span>
          <span class="rem-val">${r.temp ? `<b class="temp">${esc(r.temp)}</b>` : ''}${r.time ? `<b>${esc(r.time)}</b>` : ''}</span></span>`).join('')}
    </footer>`;
}

function settingsSheet() {
  return `
    <div class="sheet k-sheet" data-close>
      <div class="sheet-panel" role="dialog" aria-label="Temps and times">
        <header><h2>Temps &amp; times</h2><button class="close" data-close aria-label="Close">✕</button></header>
        <div class="sheet-body">
          <p class="set-hint">Clear both boxes to hide one.</p>
          ${REMINDERS.map(reminder).map((r) => `
            <div class="set">
              <span>${esc(r.label)}</span>
              <input data-rem="${r.id}" data-field="temp" value="${esc(r.temp)}" aria-label="${esc(r.label)} heat" placeholder="Heat">
              <input data-rem="${r.id}" data-field="time" value="${esc(r.time)}" aria-label="${esc(r.label)} time" placeholder="Time">
            </div>`).join('')}
        </div>
        <footer><button class="primary" data-close>Done</button></footer>
      </div>
    </div>`;
}

// ---------- sold out, closing, the scoreboard ----------

function soldOutSheet() {
  const out = K.kitchen.soldOut || {};
  return `
    <div class="sheet k-sheet" data-close>
      <div class="sheet-panel wide" role="dialog" aria-label="Sold out">
        <header><h2>Sold out</h2><button class="close" data-close aria-label="Close">✕</button></header>
        <div class="sheet-body">
          <p class="set-hint">Tap anything you've run out of. It greys out on guests' phones right away. Tap again to bring it back.</p>
          ${STOCK.map((g) => `
            <h3>${g.group}</h3>
            <div class="so-group">${g.items.map((i) => `
              <button class="so-pill ${out[i.id] ? 'on' : ''}" data-so="${i.id}" aria-pressed="${!!out[i.id]}">${esc(i.label)}${out[i.id] ? ' · sold out' : ''}</button>`).join('')}
            </div>`).join('')}
        </div>
        <footer><button class="primary" data-close>Done</button></footer>
      </div>
    </div>`;
}

function closeSheet() {
  return `
    <div class="sheet k-sheet" data-close>
      <div class="sheet-panel" role="dialog" aria-label="Close the kitchen">
        <header><h2>Close the kitchen?</h2><button class="close" data-close aria-label="Close">✕</button></header>
        <div class="sheet-body">
          <p class="set-hint">Guests' phones will say the kitchen's closed and stop taking orders. Tickets already on the rail stay until you send them out.</p>
        </div>
        <footer><button class="primary" data-shut>Close the kitchen</button></footer>
      </div>
    </div>`;
}

// The lunch in numbers, shown once the kitchen's closed and the rail is empty.
// Anything at zero isn't shown.
function scoreboard(all) {
  let burgers = 0; let doubles = 0; let patties = 0; let eggs = 0;
  for (const o of all) {
    for (const b of o.burgers || []) {
      burgers += b.qty;
      if (b.patties === 'double') doubles += b.qty;
      patties += b.qty * (b.patties === 'double' ? 2 : 1);
      if (b.egg && b.egg !== 'none') eggs += b.qty;
    }
  }
  const guests = new Set(all.map((o) => (o.name || '').trim().toLowerCase()).filter(Boolean)).size;
  const stats = [
    [burgers, 'burger', 'burgers'],
    [doubles, 'double', 'doubles'],
    [patties, 'patty', 'patties'],
    [eggs, 'fried egg', 'fried eggs'],
    ...EXTRAS.map((e) => [all.reduce((n, o) => n + (o.extras?.[e.id] || 0), 0), e.label, e.label.endsWith('milkshake') ? `${e.label}s` : e.label]),
    [guests, 'guest', 'guests'],
  ].filter(([n]) => n > 0);
  return `
    <div class="scoreboard">
      <h2 class="neon">That's a wrap!</h2>
      <div class="sb-grid">${stats.map(([n, one, many]) => `
        <div class="sb"><b class="neon">${n}</b><span>${esc(n === 1 ? one : many)}</span></div>`).join('')}
      </div>
    </div>`;
}

// ---------- page ----------

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
  const byTime = [...K.orders].sort((a, b) => placedAt(a) - placedAt(b));
  const number = new Map(byTime.map((o, n) => [o.id, n + 1]));
  const open = byTime.filter((o) => o.status !== 'ready');
  const last = byTime.filter((o) => o.status === 'ready').sort((a, b) => (b.readyMs || 0) - (a.readyMs || 0))[0];
  const soldCount = Object.values(K.kitchen.soldOut || {}).filter(Boolean).length;

  app.innerHTML = `
    <header class="k-top">
      <h1 class="neon">Kitchen</h1>
      <span class="count">${open.length ? `${open.length} to make` : 'All caught up'}</span>
      ${K.offline ? '<span class="flag">Offline</span>' : ''}
      ${IS_TEST ? `<span class="flag">Test: ${esc(EVENT)}</span>` : ''}
      ${K.kitchen.closed ? '<span class="flag shut">Closed</span>' : ''}
      ${last ? `<button class="put-back" data-undo="${last.id}">↶ Put back #${number.get(last.id)} ${esc(last.name)}</button>` : ''}
      <button class="top-btn" data-open="soldout">Sold out${soldCount ? ` <small>${soldCount}</small>` : ''}</button>
      ${K.kitchen.closed
        ? '<button class="top-btn" data-reopen>Reopen</button>'
        : '<button class="top-btn" data-open="close">Close kitchen</button>'}
      <button class="gear" data-open="settings" aria-label="Change the temps and times">⚙</button>
    </header>
    ${K.error ? `<p class="k-error">${esc(K.error)}</p>` : ''}
    ${pattyRail(open)}
    <main class="rail">
      ${open.length
        ? `<div class="tickets">${open.map((o) => ticket(o, number.get(o.id))).join('')}</div>`
        : K.kitchen.closed && K.loaded ? scoreboard(byTime)
        : `<p class="empty">${K.loaded ? 'No orders on the rail. The bell rings when one comes in.' : 'Connecting…'}</p>`}
    </main>
    ${reminderRail()}
    ${K.sheet === 'settings' ? settingsSheet() : K.sheet === 'soldout' ? soldOutSheet() : K.sheet === 'close' ? closeSheet() : ''}`;
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
  } else if ((el = t('[data-so]'))) {
    // Buttons inside a sheet are handled before the sheet's tap-outside close.
    const id = el.dataset.so;
    const now = !K.kitchen.soldOut?.[id];
    K.kitchen.soldOut = { ...K.kitchen.soldOut, [id]: now };
    fs.setDoc(stateRef, { soldOut: { [id]: now } }, { merge: true });
  } else if (t('[data-shut]')) {
    K.kitchen.closed = true;
    K.sheet = null;
    fs.setDoc(stateRef, { closed: true, closedMs: Date.now() }, { merge: true });
  } else if (t('[data-reopen]')) {
    K.kitchen.closed = false;
    fs.setDoc(stateRef, { closed: false }, { merge: true });
  } else if ((el = t('[data-close]'))) {
    if (el.classList.contains('k-sheet') && e.target !== el) return; // a tap inside the panel
    K.sheet = null;
  } else if (t('[data-cooking]')) {
    // Everything showing in the top rail just went on the griddle.
    for (const o of K.orders) {
      if (o.status !== 'ready' && !o.cooking && (o.burgers || []).length) {
        o.cooking = true;
        fs.updateDoc(fs.doc(ordersRef, o.id), { cooking: true });
      }
    }
  } else if ((el = t('[data-uncook]'))) {
    const o = K.orders.find((x) => x.id === el.dataset.uncook);
    if (o) o.cooking = false;
    fs.updateDoc(fs.doc(ordersRef, el.dataset.uncook), { cooking: false });
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

app.addEventListener('input', (e) => {
  const input = e.target.closest('[data-rem]');
  if (!input) return;
  const { rem, field } = input.dataset;
  K.reminders[rem] = { ...reminder(REMINDERS.find((r) => r.id === rem)), [field]: input.value.trim() };
  delete K.reminders[rem].id;
  delete K.reminders[rem].label;
  store.set(KEY.reminders, K.reminders);
});

setInterval(() => { if (K.started && !K.sheet) render(); }, 30000); // keep the "x min" ages fresh
render();
