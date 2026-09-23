// Kitchen helpers: timer lengths and the prep list. No DOM here.

export const DEFAULTS = {
  side1: 180, // seconds before the flip
  side2: 120, // seconds after the flip
  fries: 1500,
  rings: 180,
  onions: 2400,
  runny: 180,
  hard: 300,
};

export const TIMER_LABELS = {
  fries: 'Fries',
  rings: 'Onion rings',
  onions: 'Onions',
  side1: 'Flip the patties',
  side2: 'Patties done',
  runny: 'Runny eggs',
  hard: 'Hard eggs',
};

// Before the first guest orders. In order; some items start a timer.
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
