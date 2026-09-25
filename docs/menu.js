// What guests can order, and how an order reads back — shared by the guest
// page and the kitchen screen so both describe a burger the same way.

export const LEVELS = [['none', 'No'], ['regular', 'Yes'], ['extra', 'Extra']];
export const PATTIES = [['single', 'Single'], ['double', 'Double']];
export const EGGS = [['none', 'No egg'], ['runny', 'Runny'], ['hard', 'Hard']];

export const CHEESES = [
  { id: 'gruyere', label: 'Gruyère' },
  { id: 'cheddar', label: 'Cheddar' },
];
export const TOPPINGS = [
  { id: 'onion', label: 'Caramelized onion' },
  { id: 'pickles', label: 'Pickles' },
  { id: 'tomato', label: 'Tomato' },
  { id: 'lettuce', label: 'Lettuce' },
];
export const SAUCES = [
  { id: 'special', label: 'Special sauce' },
  { id: 'ketchup', label: 'Ketchup' },
  { id: 'mayo', label: 'Mayo' },
  { id: 'mustard', label: 'Mustard' },
];
export const EXTRAS = [
  { id: 'fries', label: 'Fries', group: 'Sides' },
  { id: 'rings', label: 'Onion rings', group: 'Sides' },
  // A dip is a cup of one of the burger sauces. It follows that sauce's
  // sold-out switch (`stock`), so there is one switch per sauce, not two.
  ...SAUCES.map((s) => ({
    id: `dip-${s.id}`, row: s.label, label: `${s.label} dip`, plural: `${s.label} dips`,
    group: 'Dipping sauces', stock: s.id,
  })),
  { id: 'vanilla', label: 'Vanilla milkshake', plural: 'Vanilla milkshakes', group: 'Milkshakes' },
  { id: 'oreo', label: 'Oreo milkshake', plural: 'Oreo milkshakes', group: 'Milkshakes' },
];

/** The sold-out switch that governs this side, shake or dip. */
export const stockOf = (e) => e.stock || e.id;

// Everything the kitchen can mark sold out, grouped the way the switches show.
export const STOCK = [
  { group: 'Burgers', items: [{ id: 'burgers', label: 'Burgers' }] },
  { group: 'Cheese', items: CHEESES },
  { group: 'Eggs', items: [{ id: 'egg', label: 'Eggs' }] },
  { group: 'Toppings', items: TOPPINGS },
  { group: 'Sauces', items: SAUCES },
  { group: 'Sides and shakes', items: EXTRAS.filter((e) => !e.stock) },
];

// Names of anything in an order (or a guest's tray) that's sold out.
export function soldOutIn(order, out = {}) {
  const hit = new Set();
  const burgers = order.burgers || [];
  if (burgers.length && out.burgers) hit.add('Burgers');
  for (const b of burgers) {
    for (const [list, levels] of [[CHEESES, b.cheese], [TOPPINGS, b.toppings], [SAUCES, b.sauces]]) {
      for (const i of list) if (out[i.id] && levels?.[i.id] && levels[i.id] !== 'none') hit.add(i.label);
    }
    if (out.egg && b.egg && b.egg !== 'none') hit.add('Eggs');
  }
  for (const e of EXTRAS) if (out[stockOf(e)] && order.extras?.[e.id] > 0) hit.add(e.label);
  return [...hit];
}

// The house burger — what the builder opens on.
export function houseBurger() {
  return {
    qty: 1,
    patties: 'single',
    egg: 'none',
    cheese: { gruyere: 'regular', cheddar: 'none' },
    toppings: { onion: 'regular', pickles: 'none', tomato: 'none', lettuce: 'none' },
    sauces: { special: 'regular', ketchup: 'none', mayo: 'none', mustard: 'none' },
  };
}

const chosen = (list, levels) => list
  .filter((i) => levels?.[i.id] && levels[i.id] !== 'none')
  .map((i) => ({ label: i.label, extra: levels[i.id] === 'extra' }));

// A burger as rows the cook reads top to bottom. Every row always says
// something — "No cheese" is as important on a ticket as "Gruyère".
export function burgerSummary(b) {
  return {
    title: b.patties === 'double' ? 'Double' : 'Single',
    rows: [
      { label: 'Cheese', items: chosen(CHEESES, b.cheese), none: 'No cheese' },
      { label: 'Egg', items: b.egg && b.egg !== 'none' ? [{ label: b.egg === 'runny' ? 'Runny' : 'Hard' }] : [], none: 'No egg' },
      { label: 'Toppings', items: chosen(TOPPINGS, b.toppings), none: 'No toppings' },
      { label: 'Sauce', items: chosen(SAUCES, b.sauces), none: 'No sauce' },
    ],
  };
}

export function extrasList(extras) {
  return EXTRAS.filter((e) => extras?.[e.id] > 0).map((e) => ({ label: e.label, qty: extras[e.id] }));
}

export function itemCount(order) {
  return order.burgers.reduce((n, b) => n + b.qty, 0)
    + Object.values(order.extras).reduce((n, q) => n + q, 0);
}

// When an order was placed, by the server's clock once it has one, so every
// phone and the kitchen agree on the order tickets came in (and their #).
export const placedAt = (o) => o.createdAt?.toMillis?.() ?? o.createdMs;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
