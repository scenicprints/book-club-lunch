// Cook mode's thinking: which burgers go on the griddle next, where the
// cheese goes, how each burger is built, and the prep list. No DOM here.
import { CHEESES, SAUCES } from './menu.js?v=4';

export const DEFAULTS = {
  capacity: 4,   // patties the griddle holds at once
  side1: 180,    // seconds before the flip
  side2: 120,    // seconds after the flip
  fries: 1500,
  rings: 180,
  onions: 2400,
  runny: 180,
  hard: 300,
};

export const TIMER_LABELS = {
  side1: 'Flip the patties',
  side2: 'Patties done',
  fries: 'Fries',
  rings: 'Onion rings',
  onions: 'Onions',
  runny: 'Runny eggs',
  hard: 'Hard eggs',
};

// One entry per physical burger (an order line with qty 2 is two burgers).
export function units(order) {
  const out = [];
  (order.burgers || []).forEach((b, i) => {
    for (let j = 0; j < b.qty; j++) {
      out.push({ key: `${i}-${j}`, orderId: order.id, name: order.name, burger: b, patties: b.patties === 'double' ? 2 : 1 });
    }
  });
  return out;
}

export const pending = (order) => units(order).filter((u) => !(order.built || []).includes(u.key));

// Oldest orders first. A burger is never split across rounds; if the next one
// doesn't fit, later single burgers can still fill the leftover spots.
export function planRound(openOrders, capacity) {
  const round = [];
  let used = 0;
  for (const o of openOrders) {
    for (const u of pending(o)) {
      if (used === 0 || used + u.patties <= capacity) {
        round.push(u);
        used += u.patties;
      }
    }
  }
  return round;
}

// Cheese per patty, bottom patty first. One slice per patty; a double with both
// cheeses gets one of each; "extra" adds one more slice of that cheese.
export function pattyCheese(b) {
  const chosen = CHEESES.filter((c) => b.cheese?.[c.id] && b.cheese[c.id] !== 'none');
  const per = Array.from({ length: b.patties === 'double' ? 2 : 1 }, () => []);
  if (per.length === 2 && chosen.length === 2) {
    per[0].push(chosen[0].label);
    per[1].push(chosen[1].label);
  } else {
    for (const p of per) for (const c of chosen) p.push(c.label);
  }
  for (const c of chosen) {
    if (b.cheese[c.id] === 'extra') {
      for (let i = per.length - 1; i >= 0; i--) if (per[i].includes(c.label)) { per[i].push(c.label); break; }
    }
  }
  return per;
}

export const cheeseText = (slices) => {
  if (!slices.length) return 'No cheese';
  const count = {};
  for (const s of slices) count[s] = (count[s] || 0) + 1;
  return Object.entries(count).map(([name, n]) => (n > 1 ? `${n} ${name}` : name)).join(' + ');
};

// How to stack it, bottom to top.
export function buildLayers(b) {
  const L = [{ text: 'Bottom bun' }];
  const add = (label, level) => { if (level && level !== 'none') L.push({ text: label, extra: level === 'extra' }); };
  for (const s of SAUCES) add(s.label, b.sauces?.[s.id]);
  add('Lettuce', b.toppings?.lettuce);
  add('Tomato', b.toppings?.tomato);
  const cheese = pattyCheese(b);
  cheese.forEach((slices, n) => {
    const which = cheese.length > 1 ? (n === 0 ? 'Bottom patty' : 'Top patty') : 'Patty';
    L.push({ text: `${which} · ${cheeseText(slices)}`, patty: true });
  });
  add('Caramelized onion', b.toppings?.onion);
  add('Pickles', b.toppings?.pickles);
  if (b.egg && b.egg !== 'none') L.push({ text: b.egg === 'runny' ? 'Runny egg' : 'Hard egg' });
  L.push({ text: 'Top bun' });
  return L;
}

// Before the first guest orders. In order; some steps start a timer.
export const PREP = [
  { id: 'onions', text: 'Caramelize the onions', note: 'Do these first. They take a while, and you just rewarm them later.', timer: 'onions' },
  { id: 'sauce', text: 'Make the special sauce and put it in the fridge' },
  { id: 'veg', text: 'Slice the tomatoes, wash and dry the lettuce, set out the pickles' },
  { id: 'cheese', text: 'Separate the Gruyère and American slices' },
  { id: 'beef', text: 'Roll the beef into balls, ready to smash' },
  { id: 'buns', text: 'Set out the buns and butter for toasting' },
  { id: 'oven', text: 'Oven on to 425°F' },
  { id: 'rings', text: 'Deep fryer on. Fry all the onion rings, enough for seconds', note: 'Keep them warm on a tray in the oven.', timer: 'rings' },
  { id: 'fryer-off', text: 'Turn the deep fryer OFF', note: 'The fryer and the griddle together trip the breaker. The air fryer stays off all lunch too.', warn: true },
  { id: 'fries', text: 'Fries into the oven', note: 'Start another tray any time from + Timer.', timer: 'fries' },
  { id: 'griddle', text: 'Griddle on to heat up' },
  { id: 'shakes', text: 'Blender out, ice cream and milk in reach' },
];
