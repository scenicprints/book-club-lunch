import { EVENT, connect } from './fb.js?v=10';
import {
  LEVELS, PATTIES, EGGS, CHEESES, TOPPINGS, SAUCES, EXTRAS,
  houseBurger, burgerSummary, extrasList, itemCount, esc,
} from './menu.js?v=10';

const app = document.getElementById('app');

// localStorage can be missing (private mode); the page still works, it just
// forgets the guest's name and past orders on reload.
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const KEY = { name: `${EVENT}:name`, sent: `${EVENT}:sent` };

const emptyTray = () => ({ burgers: [], extras: { fries: 0, rings: 0, vanilla: 0, oreo: 0 }, notes: '' });

const S = {
  name: store.get(KEY.name, ''),
  sent: store.get(KEY.sent, []), // orders sent from this phone, newest last
  tray: emptyTray(),
  sheet: null,                   // { index, burger, fresh } while building a burger
  sending: false,
  error: '',
  pendingId: null,
};
S.screen = S.name ? 'build' : 'start';

const conn = connect();
conn.catch(() => {
  S.error = "Can't reach the kitchen right now. Check your signal and reload the page.";
  render();
});

// ---------- the burger drawing ----------

// Layers top to bottom. Keys stay stable so only a newly added layer drops in.
function layers(b) {
  const out = [['bun-top', 'bun-top']];
  for (const s of SAUCES) if (b.sauces[s.id] !== 'none') out.push([`sauce-${s.id}`, `sauce ${s.id}`, b.sauces[s.id]]);
  for (const id of ['lettuce', 'tomato', 'pickles', 'onion']) {
    if (b.toppings[id] !== 'none') out.push([id, id, b.toppings[id]]);
  }
  if (b.egg !== 'none') out.push(['egg', `egg ${b.egg}`]);
  for (const c of ['american', 'gruyere']) if (b.cheese[c] !== 'none') out.push([`cheese-${c}`, `cheese ${c}`, b.cheese[c]]);
  out.push(['patty', 'patty']);
  if (b.patties === 'double') out.push(['patty-2', 'patty']);
  out.push(['bun-bottom', 'bun-bottom']);
  return out;
}

let shown = new Set(); // layer keys in the builder preview last time it drew
function stack(b, { animate = false } = {}) {
  const ls = layers(b);
  const html = ls.map(([key, cls, level]) =>
    `<div class="l ${cls} ${level === 'extra' ? 'extra' : ''} ${animate && !shown.has(key) ? 'drop' : ''}"></div>`).join('');
  if (animate) shown = new Set(ls.map(([key]) => key));
  return `<div class="stack" aria-hidden="true">${html}</div>`;
}

// ---------- views ----------

const seg = (options, value, action, attrs = '') => `
  <div class="seg" role="group">${options.map(([v, label]) => `
    <button type="button" class="${v === value ? 'on' : ''} ${v === 'extra' ? 'is-extra' : ''}"
      aria-pressed="${v === value}" data-a="${action}" data-v="${v}" ${attrs}>${label}</button>`).join('')}
  </div>`;

const stepper = (qty, action, attrs, min = 0, label = '') => `
  <div class="stepper">
    <button type="button" data-a="${action}" data-d="-1" ${attrs} ${qty <= min ? 'disabled' : ''} aria-label="One less ${label}">−</button>
    <span aria-live="polite">${qty}</span>
    <button type="button" data-a="${action}" data-d="1" ${attrs} aria-label="One more ${label}">+</button>
  </div>`;

const summaryHtml = (b) => burgerSummary(b).rows.map((r) => `<p><span class="k">${r.label}</span><span>${r.items.length
  ? r.items.map((i) => esc(i.label) + (i.extra ? ' <b class="x">extra</b>' : '')).join(', ')
  : `<i>${r.none}</i>`}</span></p>`).join('');

const sign = (small = false) => `
  <header class="sign ${small ? 'small' : ''}">
    <div class="board">
      <p class="kicker">Book Club</p>
      <h1 class="neon">Lunch</h1>
    </div>
  </header>`;

function startView() {
  return `
    ${sign()}
    <form class="card" data-form="start">
      <label for="name">Name for the order</label>
      <input id="name" value="${esc(S.name)}" maxlength="40" autocomplete="given-name" enterkeyhint="go" placeholder="Your name">
      <button class="primary" type="submit">Let's eat</button>
    </form>`;
}

function buildView() {
  const t = S.tray;
  const count = itemCount(t);
  return `
    ${sign(true)}
    <div class="bar">
      <p>Order for <b>${esc(S.name)}</b> <button class="link" data-a="rename">change</button></p>
      ${S.sent.length ? '<button class="link" data-a="sent">Already ordered</button>' : ''}
    </div>

    <section>
      <h2 class="menu-head">Burgers</h2>
      ${t.burgers.map((b, i) => `
        <article class="card burger">
          <div class="mini">${stack(b)}</div>
          <div class="burger-head">
            <h3>${b.patties === 'double' ? 'Double' : 'Single'}</h3>
            ${stepper(b.qty, 'burger-qty', `data-i="${i}"`, 1, 'of this burger')}
          </div>
          <div class="summary">${summaryHtml(b)}</div>
          <div class="burger-actions">
            <button class="link" data-a="edit-burger" data-i="${i}">Change</button>
            <button class="link danger" data-a="remove-burger" data-i="${i}">Remove</button>
          </div>
        </article>`).join('')}
      <button class="add" data-a="new-burger">${t.burgers.length ? '+ Another burger' : '+ Build a burger'}</button>
    </section>

    ${[['Sides', ''], ['Milkshakes', '']].map(([group]) => `
      <section>
        <h2 class="menu-head">${group}</h2>
        <div class="card list">
          ${EXTRAS.filter((e) => e.group === group).map((e) => `
            <div class="row"><span>${e.label}</span>${stepper(t.extras[e.id], 'extra', `data-id="${e.id}"`, 0, e.label)}</div>`).join('')}
        </div>
      </section>`).join('')}

    <section>
      <h2 class="menu-head">Special requests</h2>
      <textarea id="notes" rows="2" maxlength="300" placeholder="Cut it in half, sauce on the side…">${esc(t.notes)}</textarea>
    </section>

    ${S.error ? `<p class="error">${esc(S.error)}</p>` : ''}

    <div class="dock"><div class="checker"></div><div class="inner">
      <button class="primary" data-a="send" ${!count || S.sending ? 'disabled' : ''}>
        ${S.sending ? 'Sending…' : count ? `Send to the kitchen · ${count}` : 'Pick something to eat'}
      </button>
    </div></div>
    ${S.sheet ? sheetView() : ''}`;
}

function sheetView() {
  const b = S.sheet.burger;
  const rows = (list, group) => list.map((i) => `
    <div class="row"><span>${i.label}</span>${seg(LEVELS, b[group][i.id], 'set', `data-group="${group}" data-id="${i.id}"`)}</div>`).join('');
  if (S.sheet.fresh) shown = new Set(layers(b).map(([key]) => key));
  return `
    <div class="sheet">
      <div class="sheet-panel ${S.sheet.fresh ? 'enter' : ''}" role="dialog" aria-modal="true" aria-label="Build your burger">
        <header>
          <h2>${S.sheet.index < 0 ? 'Build your burger' : 'Your burger'}</h2>
          <button class="close" data-a="sheet-close" aria-label="Close without saving">✕</button>
        </header>
        <div class="preview">${stack(b, { animate: true })}</div>
        <div class="sheet-body">
          <h3>Patties</h3>${seg(PATTIES, b.patties, 'set-one', 'data-key="patties"')}
          <h3>Cheese</h3><div class="card list">${rows(CHEESES, 'cheese')}</div>
          <h3>Fried egg</h3>${seg(EGGS, b.egg, 'set-one', 'data-key="egg"')}
          <h3>Toppings</h3><div class="card list">${rows(TOPPINGS, 'toppings')}</div>
          <h3>Sauces</h3><div class="card list">${rows(SAUCES, 'sauces')}</div>
        </div>
        <footer>
          ${stepper(b.qty, 'sheet-qty', '', 1, 'of this burger')}
          <button class="primary" data-a="sheet-save">${S.sheet.index < 0 ? 'Add to order' : 'Save'}</button>
        </footer>
      </div>
    </div>`;
}

function orderLines(o) {
  return [
    ...o.burgers.map((b) => `${b.qty > 1 ? `${b.qty}× ` : ''}${b.patties === 'double' ? 'Double' : 'Single'} burger`),
    ...extrasList(o.extras).map((e) => `${e.qty > 1 ? `${e.qty}× ` : ''}${e.label}`),
  ];
}

function sentView() {
  const orders = [...S.sent].reverse();
  return `
    ${sign(true)}
    <span class="stamp">Order's in!</span>
    <p class="lede" style="text-align:center;color:var(--muted);margin:10px 0 22px">
      It's on its way to the kitchen, ${esc(S.name)}. Want seconds? Just order again.</p>
    ${orders.map((o, n) => `
      <article class="card sent">
        <h3>${orders.length > 1 ? `Order ${orders.length - n}` : 'Your order'}</h3>
        <ul>${orderLines(o).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
        ${o.notes ? `<p class="note">“${esc(o.notes)}”</p>` : ''}
      </article>`).join('')}
    <div class="dock"><div class="checker"></div><div class="inner">
      <button class="primary" data-a="more">Order more</button>
    </div></div>`;
}

function render() {
  const scroll = app.querySelector('.sheet-body')?.scrollTop;
  app.innerHTML = `<div class="awning"></div><div class="wrap">${
    S.screen === 'start' ? startView() : S.screen === 'sent' ? sentView() : buildView()
  }</div>`;
  const body = app.querySelector('.sheet-body');
  if (body && scroll != null) body.scrollTop = scroll;
  if (S.sheet) S.sheet.fresh = false;
  document.body.classList.toggle('locked', !!S.sheet);
}

// ---------- actions ----------

async function send() {
  S.sending = true;
  S.error = '';
  render();
  try {
    const { fs, orders } = await conn;
    // The id is made once, so tapping Send again after a timeout rewrites the
    // same order instead of handing the kitchen a duplicate.
    const ref = S.pendingId ? fs.doc(orders, S.pendingId) : fs.doc(orders);
    S.pendingId = ref.id;
    const order = {
      name: S.name.trim(),
      burgers: S.tray.burgers,
      extras: Object.fromEntries(Object.entries(S.tray.extras).filter(([, q]) => q > 0)),
      notes: S.tray.notes.trim(),
      status: 'new',
      createdMs: Date.now(),
      createdAt: fs.serverTimestamp(),
    };
    await Promise.race([
      fs.setDoc(ref, order),
      new Promise((_, fail) => setTimeout(() => fail(new Error('timeout')), 15000)),
    ]);
    S.pendingId = null;
    S.sent.push({ burgers: order.burgers, extras: order.extras, notes: order.notes });
    store.set(KEY.sent, S.sent);
    S.tray = emptyTray();
    S.screen = 'sent';
    window.scrollTo(0, 0);
  } catch {
    S.error = "Couldn't reach the kitchen. Check your signal and tap Send again.";
  }
  S.sending = false;
  render();
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = app.querySelector('#name');
  if (!S.name.trim()) {
    input.focus();
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }
  store.set(KEY.name, S.name.trim());
  S.screen = 'build';
  render();
});

app.addEventListener('input', (e) => {
  if (e.target.id === 'name') S.name = e.target.value;
  if (e.target.id === 'notes') S.tray.notes = e.target.value;
});

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const { a, i, d, v, id, group, key } = el.dataset;
  const t = S.tray;
  switch (a) {
    case 'rename': S.screen = 'start'; break;
    case 'sent': S.screen = 'sent'; window.scrollTo(0, 0); break;
    case 'more': S.screen = 'build'; window.scrollTo(0, 0); break;
    case 'new-burger': S.sheet = { index: -1, burger: houseBurger(), fresh: true }; break;
    case 'edit-burger': S.sheet = { index: +i, burger: structuredClone(t.burgers[+i]), fresh: true }; break;
    case 'remove-burger': t.burgers.splice(+i, 1); break;
    case 'burger-qty': t.burgers[+i].qty = clamp(t.burgers[+i].qty + +d, 1, 20); break;
    case 'extra': t.extras[id] = clamp(t.extras[id] + +d, 0, 20); break;
    case 'set': S.sheet.burger[group][id] = v; break;
    case 'set-one': S.sheet.burger[key] = v; break;
    case 'sheet-qty': S.sheet.burger.qty = clamp(S.sheet.burger.qty + +d, 1, 20); break;
    case 'sheet-close': S.sheet = null; break;
    case 'sheet-save':
      if (S.sheet.index < 0) t.burgers.push(S.sheet.burger);
      else t.burgers[S.sheet.index] = S.sheet.burger;
      S.sheet = null;
      break;
    case 'send': send(); return;
    default: return;
  }
  render();
});

render();
