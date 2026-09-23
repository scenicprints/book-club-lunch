// What guests can order, and how an order reads back — shared by the guest
// page and the kitchen screen so both describe a burger the same way.

export const LEVELS = [['none', 'No'], ['regular', 'Yes'], ['extra', 'Extra']];
export const PATTIES = [['single', 'Single'], ['double', 'Double']];
export const EGGS = [['none', 'No egg'], ['runny', 'Runny'], ['hard', 'Hard']];

export const CHEESES = [
  { id: 'gruyere', label: 'Gruyère' },
  { id: 'american', label: 'American' },
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
  { id: 'vanilla', label: 'Vanilla milkshake', group: 'Milkshakes' },
  { id: 'oreo', label: 'Oreo milkshake', group: 'Milkshakes' },
];

// The house burger — what the builder opens on.
export function houseBurger() {
  return {
    qty: 1,
    patties: 'single',
    egg: 'none',
    cheese: { gruyere: 'regular', american: 'none' },
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

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
