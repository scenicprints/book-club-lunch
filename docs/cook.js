// The reminder rail along the bottom of the kitchen screen: where, what heat
// and how long for each thing. Nothing counts down. Numbers come from Kevin's
// Pantry recipes (dial numbers are his stove's 0–10), moved to where he's
// actually cooking. Editable on the iPad under ⚙; clearing both boxes hides one.

export const REMINDERS = [
  { id: 'parboil', label: 'Fries parboil', temp: 'Pot, boil 9–10 → simmer 3–4', time: '8–10 min' },
  { id: 'fries', label: 'Fries', temp: 'Oven 450°F', time: '25 min, flip, 15–20 min' },
  { id: 'rings', label: 'Onion rings', temp: 'Fryer 375°F', time: '3–4 min' },
  { id: 'patties', label: 'Patties', temp: 'Skillet 7', time: '3–4 min, flip, 2 min · 160°F' },
  { id: 'runny', label: 'Runny egg', temp: 'Skillet 5', time: '2–3 min' },
  { id: 'hard', label: 'Hard egg', temp: 'Skillet 5', time: '4 min, flipped' },
  { id: 'buns', label: 'Buns', temp: 'Center griddle, medium', time: '45–60 sec' },
];
