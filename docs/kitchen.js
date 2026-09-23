import { EVENT, connect } from './fb.js?v=4';
import { unlockBell, ring } from './bell.js?v=4';
import { EXTRAS, burgerSummary, extrasList, esc } from './menu.js?v=4';
import {
  DEFAULTS, TIMER_LABELS, PREP, units, pending, planRound, pattyCheese, cheeseText, buildLayers,
} from './cook.js?v=4';
import { startTimer, stopTimer, setPresets, fmt, paintCountdowns } from './timers.js?v=4';

const app = document.getElementById('app');
const IS_TEST = EVENT !== 'book-club-lunch-2026-09-26';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const KEY = { tab: 'kitchen:tab', settings: 'kitchen:settings', prep: `${EVENT}:prep`, round: `${EVENT}:round` };

const K = {
  started: false,
  loaded: false,
  offline: false,
  error: '',
  orders: [],
  seen: new Set(),
  fresh: new Set(), // tickets that just arrived, swung onto the rail
  tab: store.get(KEY.tab, 'prep'),
  settings: { ...DEFAULTS, ...store.get(KEY.settings, {}) },
  prep: new Set(store.get(KEY.prep, [])),
  round: store.get(KEY.round, null), // { items: [{orderId, key}], step, ticked: ['orderId/key'] }
  sent: new Set(),                    // orders marked up from the cook screen
  showSettings: false,
};
let fs;
let ordersRef;

const saveRound = () => store.set(KEY.round, K.round);
const presets = () => ['fries', 'rings', 'onions', 'runny', 'hard', 'side1', 'side2']
  .map((k) => [TIMER_LABELS[k], K.settings[k]]);
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
const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const burgerName = (b) => (b.patties === 'double' ? 'Double' : 'Single');

// Orders still to make, oldest first, each with its arrival number.
function queue() {
  const byTime = [...K.orders].sort((a, b) => a.createdMs - b.createdMs);
  const number = new Map(byTime.map((o, n) => [o.id, n + 1]));
  return { byTime, number, open: byTime.filter((o) => o.status !== 'ready') };
}

// ---------- tickets tab ----------

function ticket(o, number) {
  const extras = extrasList(o.extras);
  const all = units(o).length;
  const built = all - pending(o).length;
  return `
    <article class="ticket ${K.fresh.has(o.id) ? 'fresh' : ''}">
      <header>
        <span class="num">#${number}</span>
        <h2>${esc(o.name)}</h2>
        <span class="age">${ago(o.createdMs)}</span>
      </header>
      ${all && built ? `<p class="progress">Built ${built} of ${all}</p>` : ''}
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

function ticketsView({ open, byTime, number }) {
  const done = byTime.filter((o) => o.status === 'ready').sort((a, b) => (b.readyMs || 0) - (a.readyMs || 0));
  return `
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
      </section>` : ''}`;
}

// ---------- prep tab ----------

function prepView() {
  const left = PREP.filter((p) => !K.prep.has(p.id)).length;
  return `
    <div class="panel-wrap">
      <section class="panel">
        <h2 class="step-title">Before anyone orders</h2>
        <p class="step-sub">${left ? `${count(left, 'thing')} left. Tap each one when it's done.` : "All prepped. You're ready to cook."}</p>
        <ol class="prep">
          ${PREP.map((p) => `
            <li class="${K.prep.has(p.id) ? 'done' : ''} ${p.warn ? 'warn' : ''}">
              <button class="check" data-prep="${p.id}" aria-pressed="${K.prep.has(p.id)}">
                <span class="box" aria-hidden="true">${K.prep.has(p.id) ? '✓' : ''}</span>
                <span class="what"><b>${p.text}</b>${p.note ? `<small>${p.note}</small>` : ''}</span>
              </button>
              ${p.timer ? `<button class="mini-timer" data-start-timer="${p.timer}">⏱ ${fmt(K.settings[p.timer])}</button>` : ''}
            </li>`).join('')}
        </ol>
        <button class="primary big" data-tab="cook">${left ? 'Skip to cooking' : 'Start cooking'}</button>
      </section>
    </div>`;
}

// ---------- cook tab ----------

function roundUnits() {
  const byId = new Map(K.orders.map((o) => [o.id, o]));
  return K.round.items.map(({ orderId, key }) => {
    const o = byId.get(orderId);
    return o && units(o).find((u) => u.key === key);
  }).filter(Boolean);
}

// Every patty on the griddle, numbered left to right.
function griddle(list, withCheese) {
  const spots = [];
  for (const u of list) {
    pattyCheese(u.burger).forEach((slices, p) => spots.push({
      name: u.name,
      what: u.patties === 2 ? `Double · ${p === 0 ? 'bottom' : 'top'}` : 'Single',
      cheese: cheeseText(slices),
      none: !slices.length,
    }));
  }
  return `
    <div class="griddle">
      ${spots.map((s, i) => `
        <div class="spot">
          <span class="spot-n">${i + 1}</span>
          <b>${esc(s.name)}</b>
          <small>${s.what}</small>
          ${withCheese ? `<span class="spot-cheese ${s.none ? 'none' : ''}">${s.cheese}</span>` : ''}
        </div>`).join('')}
    </div>`;
}

// What goes on the plate besides the burgers.
function plateCard(o, number, builtNow = 0) {
  const items = EXTRAS.filter((e) => o.extras?.[e.id] > 0);
  const kept = units(o).length - builtNow;
  const sent = K.sent.has(o.id) || o.status === 'ready';
  return `
    <article class="plate ${sent ? 'sent' : ''}">
      <header><span class="num">#${number}</span><h3>${esc(o.name)}</h3></header>
      <ul>
        ${builtNow ? `<li><b>${count(builtNow, 'burger')}</b> <span>just built</span></li>` : ''}
        ${kept ? `<li><b>${count(kept, 'burger')}</b> <span>kept warm from last round</span></li>` : ''}
        ${items.map((e) => `<li><b>${o.extras[e.id]}× ${e.label}</b>
          <span>${e.group === 'Sides' ? 'from the oven' : 'blend it now'}</span></li>`).join('')}
      </ul>
      ${o.notes ? `<p class="note">${esc(o.notes)}</p>` : ''}
      ${sent ? '<p class="sent-mark">Sent ✓</p>' : `<button class="orderup" data-done="${o.id}">Order up!</button>`}
    </article>`;
}

function idleView({ open, number }) {
  const plan = planRound(open, K.settings.capacity);
  const ready = open.filter((o) => !pending(o).length);
  const patties = plan.reduce((n, u) => n + u.patties, 0);
  const waiting = open.reduce((n, o) => n + pending(o).length, 0) - plan.length;
  return `
    <div class="panel-wrap">
      ${ready.length ? `
        <section class="panel">
          <h2 class="step-title">Ready to plate</h2>
          <div class="plates">${ready.map((o) => plateCard(o, number.get(o.id))).join('')}</div>
        </section>` : ''}
      ${plan.length ? `
        <section class="panel">
          <h2 class="step-title">Next round: ${count(patties, 'patty', 'patties')}</h2>
          <ul class="round-list">
            ${plan.map((u) => `<li><span class="num">#${number.get(u.orderId)}</span> <b>${esc(u.name)}</b> ${burgerName(u.burger)}</li>`).join('')}
          </ul>
          ${waiting > 0 ? `<p class="step-sub">${count(waiting, 'more burger')} waiting after this round.</p>` : ''}
          <button class="primary big" data-start-round>Start this round</button>
        </section>`
      : !ready.length ? `<p class="empty">${K.loaded ? 'Nothing to cook. The bell rings when an order comes in.' : 'Connecting…'}</p>` : ''}
    </div>`;
}

function roundView({ number }) {
  const list = roundUnits();
  const s = K.settings;
  const patties = list.reduce((n, u) => n + u.patties, 0);
  const eggs = { runny: 0, hard: 0 };
  for (const u of list) if (eggs[u.burger.egg] != null) eggs[u.burger.egg]++;
  const step = K.round.step;
  const dots = ['Smash', 'Flip', 'Pull', 'Build', 'Plate']
    .map((l, i) => `<span class="${i === step ? 'on' : i < step ? 'past' : ''}">${l}</span>`).join('');
  const back = step > 0 && step < 4 ? '<button class="ghost" data-step="-1">Back</button>' : '';

  let body = '';
  if (step === 0) {
    body = `
      <h2 class="step-title">Put ${count(patties, 'ball')} of beef on the griddle and smash them flat</h2>
      ${griddle(list, false)}
      <div class="meanwhile"><b>Meanwhile:</b> toast ${count(list.length, 'bun')} in the skillet.
        ${eggs.hard ? `<br>Then crack the <b>${count(eggs.hard, 'hard egg')}</b> in now. They take the longest.
          <button class="mini-timer" data-start-timer="hard">⏱ Hard eggs ${fmt(s.hard)}</button>` : ''}
      </div>
      <div class="actions">${back}<button class="primary big" data-next data-timer-key="side1">Smashed. Start the ${fmt(s.side1)} timer</button></div>`;
  } else if (step === 1) {
    body = `
      <h2 class="step-title">Flip when it rings <b class="countdown" data-countdown="${TIMER_LABELS.side1}"></b></h2>
      <p class="step-sub">As you flip, cheese goes on each patty:</p>
      ${griddle(list, true)}
      ${eggs.runny ? `
        <div class="meanwhile"><b>Meanwhile:</b> crack the <b>${count(eggs.runny, 'runny egg')}</b> into the skillet.
          <button class="mini-timer" data-start-timer="runny">⏱ Runny eggs ${fmt(s.runny)}</button>
        </div>` : ''}
      <div class="actions">${back}<button class="primary big" data-next data-timer-key="side2">Flipped and cheesed. Start the ${fmt(s.side2)} timer</button></div>`;
  } else if (step === 2) {
    body = `
      <h2 class="step-title">Pull them when it rings <b class="countdown" data-countdown="${TIMER_LABELS.side2}"></b></h2>
      <div class="meanwhile warn"><b>Before you pull:</b> the thickest patty should read <b>160°F</b> inside.
        If it's not there yet, give it another minute.</div>
      <div class="actions">${back}<button class="primary big" data-next>Patties are off the griddle</button></div>`;
  } else if (step === 3) {
    const ticked = new Set(K.round.ticked);
    const allDone = list.every((u) => ticked.has(`${u.orderId}/${u.key}`));
    body = `
      <h2 class="step-title">Build them, bottom to top</h2>
      <p class="step-sub">Tap a card when that burger is built.</p>
      <div class="builds">
        ${list.map((u) => {
          const id = `${u.orderId}/${u.key}`;
          return `
            <button class="build ${ticked.has(id) ? 'done' : ''}" data-tick="${id}">
              <header><span class="num">#${number.get(u.orderId)}</span><b>${esc(u.name)}</b><small>${burgerName(u.burger)}</small></header>
              <ol>${buildLayers(u.burger).map((l) => `
                <li class="${l.patty ? 'patty' : ''}">${esc(l.text)}${l.extra ? ' <b class="x">extra</b>' : ''}</li>`).join('')}
              </ol>
              <span class="built-mark">${ticked.has(id) ? 'Built ✓' : 'Tap when built'}</span>
            </button>`;
        }).join('')}
      </div>
      <div class="actions">${back}<button class="primary big" data-next ${allDone ? '' : 'disabled'}>${allDone ? 'All built. Plate them' : `Build all ${list.length} first`}</button></div>`;
  } else {
    const ids = [...new Set(list.map((u) => u.orderId))];
    const inRound = ids.map((id) => K.orders.find((o) => o.id === id)).filter(Boolean);
    const builtNow = (o) => list.filter((u) => u.orderId === o.id).length;
    body = `
      <h2 class="step-title">Plate it up</h2>
      <div class="plates">
        ${inRound.map((o) => (pending(o).length
          ? `<article class="plate hold"><header><span class="num">#${number.get(o.id)}</span><h3>${esc(o.name)}</h3></header>
               <p>${count(pending(o).length, 'more burger')} still to cook. Keep these warm; they go out after the next round.</p></article>`
          : plateCard(o, number.get(o.id), builtNow(o)))).join('')}
      </div>
      <div class="actions"><button class="primary big" data-end-round>Done. Next round</button></div>`;
  }
  return `
    <div class="panel-wrap">
      <section class="panel round">
        <div class="steps">${dots}</div>
        ${body}
      </section>
    </div>`;
}

// ---------- settings ----------

function settingsView() {
  const s = K.settings;
  const mins = (k) => `<label class="set"><span>${TIMER_LABELS[k]}</span>
    <input type="number" inputmode="decimal" min="0.5" step="0.5" data-setting="${k}" value="${s[k] / 60}"><em>min</em></label>`;
  return `
    <div class="sheet k-sheet" data-close-settings>
      <div class="sheet-panel" role="dialog" aria-label="Kitchen settings">
        <header><h2>Settings</h2><button class="close" data-close-settings aria-label="Close">✕</button></header>
        <div class="sheet-body">
          <h3>Griddle</h3>
          <label class="set"><span>Patties at once</span>
            <input type="number" inputmode="numeric" min="1" max="12" step="1" data-setting="capacity" value="${s.capacity}"></label>
          <h3>Timers</h3>
          ${['side1', 'side2', 'fries', 'rings', 'onions', 'runny', 'hard'].map(mins).join('')}
        </div>
        <footer><button class="primary" data-close-settings>Done</button></footer>
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
        <p>Prep list, cooking rounds with timers, and every order as a ticket.</p>
        <button class="primary" data-start>Open the kitchen</button>
        <p class="fine">Turns on the bell and keeps the screen awake.</p>
        ${IS_TEST ? `<p class="fine"><b>Test event:</b> ${esc(EVENT)}</p>` : ''}
      </div></div>`;
    return;
  }
  const q = queue();
  const prepLeft = PREP.filter((p) => !K.prep.has(p.id)).length;
  const tab = (id, label) => `<button class="tab ${K.tab === id ? 'on' : ''}" data-tab="${id}">${label}</button>`;
  app.innerHTML = `
    <header class="k-top">
      <h1 class="neon">Kitchen</h1>
      <nav class="tabs">
        ${tab('prep', prepLeft ? `Prep <small>${prepLeft}</small>` : 'Prep ✓')}
        ${tab('cook', K.round ? 'Cook <small>live</small>' : 'Cook')}
        ${tab('tickets', `Tickets${q.open.length ? ` <small>${q.open.length}</small>` : ''}`)}
      </nav>
      ${K.offline ? '<span class="flag">Offline</span>' : ''}
      ${IS_TEST ? `<span class="flag">Test: ${esc(EVENT)}</span>` : ''}
      <button class="gear" data-settings aria-label="Settings">⚙</button>
    </header>
    ${K.error ? `<p class="k-error">${esc(K.error)}</p>` : ''}
    ${K.tab === 'prep' ? prepView() : K.tab === 'cook' ? (K.round ? roundView(q) : idleView(q)) : ticketsView(q)}
    ${K.showSettings ? settingsView() : ''}`;
  paintCountdowns();
}

// ---------- actions ----------

function nextStep(timerKey) {
  // Moving on means the step's own timer did its job; don't let it ring on.
  if (K.round.step === 1) stopTimer(TIMER_LABELS.side1);
  if (K.round.step === 2) stopTimer(TIMER_LABELS.side2);
  if (timerKey) startTimer(TIMER_LABELS[timerKey], K.settings[timerKey]);
  if (K.round.step === 3) {
    // Record which burgers are built, so the tickets and the next round know.
    const byOrder = {};
    for (const u of roundUnits()) (byOrder[u.orderId] ||= []).push(u.key);
    for (const [id, keys] of Object.entries(byOrder)) {
      const o = K.orders.find((x) => x.id === id);
      if (o) o.built = [...new Set([...(o.built || []), ...keys])]; // show it right away
      fs.updateDoc(fs.doc(ordersRef, id), { built: fs.arrayUnion(...keys) });
    }
  }
  K.round.step += 1;
  saveRound();
}

app.addEventListener('click', (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;
  if (t('[data-start]')) {
    unlockBell();
    stayAwake();
    K.started = true;
    document.body.classList.add('started');
  } else if ((el = t('[data-tab]'))) {
    K.tab = el.dataset.tab;
    store.set(KEY.tab, K.tab);
    window.scrollTo(0, 0);
  } else if ((el = t('[data-prep]'))) {
    const id = el.dataset.prep;
    if (K.prep.has(id)) K.prep.delete(id); else K.prep.add(id);
    store.set(KEY.prep, [...K.prep]);
  } else if ((el = t('[data-start-timer]'))) {
    const k = el.dataset.startTimer;
    startTimer(TIMER_LABELS[k], K.settings[k]);
    return;
  } else if (t('[data-start-round]')) {
    const plan = planRound(queue().open, K.settings.capacity);
    K.round = { items: plan.map((u) => ({ orderId: u.orderId, key: u.key })), step: 0, ticked: [] };
    K.sent = new Set();
    saveRound();
    window.scrollTo(0, 0);
  } else if ((el = t('[data-next]'))) {
    nextStep(el.dataset.timerKey);
    window.scrollTo(0, 0);
  } else if ((el = t('[data-step]'))) {
    K.round.step = Math.max(0, K.round.step + +el.dataset.step);
    saveRound();
  } else if ((el = t('[data-tick]'))) {
    const id = el.dataset.tick;
    const set = new Set(K.round.ticked);
    if (set.has(id)) set.delete(id); else set.add(id);
    K.round.ticked = [...set];
    saveRound();
  } else if (t('[data-end-round]')) {
    K.round = null;
    saveRound();
    window.scrollTo(0, 0);
  } else if ((el = t('[data-done]'))) {
    K.sent.add(el.dataset.done);
    fs.updateDoc(fs.doc(ordersRef, el.dataset.done), { status: 'ready', readyMs: Date.now() });
  } else if ((el = t('[data-undo]'))) {
    K.sent.delete(el.dataset.undo);
    fs.updateDoc(fs.doc(ordersRef, el.dataset.undo), { status: 'new' });
    return;
  } else if (t('[data-settings]')) {
    K.showSettings = true;
  } else if ((el = t('[data-close-settings]'))) {
    if (el.classList.contains('k-sheet') && e.target !== el) return; // a tap inside the panel
    K.showSettings = false;
  } else {
    return;
  }
  render();
});

app.addEventListener('change', (e) => {
  const input = e.target.closest('[data-setting]');
  if (!input) return;
  const k = input.dataset.setting;
  const v = Number(input.value);
  if (!(v > 0)) return;
  K.settings[k] = k === 'capacity' ? Math.round(v) : Math.round(v * 60);
  store.set(KEY.settings, K.settings);
  setPresets(presets());
});

setInterval(() => { if (K.started && !K.showSettings) render(); }, 30000); // keep the "x min" ages fresh
render();
