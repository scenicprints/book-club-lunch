// The reminder rail along the bottom of the kitchen screen: the heat (°F or
// Kevin's 0–10 stove dial) and how long for each thing. Nothing counts down.
// Numbers come from his Pantry recipes. Editable on the iPad under ⚙;
// clearing both boxes hides one.

export const REMINDERS = [
  { id: 'parboil', label: 'Parboil fries', temp: '9–10 → 3–4', time: '8–10 min' },
  { id: 'fries', label: 'Fries', temp: '450°F', time: '25, flip, 15–20 min' },
  { id: 'rings', label: 'Rings', temp: '375°F', time: '3–4 min' },
  { id: 'patties', label: 'Patties', temp: '7', time: '3–4, flip, 2 min · 160°F' },
  { id: 'runny', label: 'Runny egg', temp: '5', time: '2–3 min' },
  { id: 'hard', label: 'Hard egg', temp: '5', time: '4 min, flipped' },
  { id: 'buns', label: 'Buns', temp: 'Med', time: '45–60 sec' },
];
