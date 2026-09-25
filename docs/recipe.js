// Cooking mode: the whole lunch as one recipe, in the order Kevin cooks it.
// Onions go on first and cook while everything else happens, the sauce is
// made while they soften, then the prep, then the fryer and oven, then the
// things made for every order. Amounts are for 8 with seconds. Methods for
// the onions and rings come from his Pantry recipes; stove numbers are his
// 0–10 dial. Timers are per step, keep counting when you move on, and ring
// when they finish.

export const SECTIONS = ['Start here', 'Prep', 'Fire up', 'Every order'];

export const STEPS = [
  {
    id: 'onions-start',
    section: 'Start here',
    title: 'Start the onions',
    items: ['4 yellow onions', '2 tbsp butter', '1 tbsp canola', 'Big pinch of salt'],
    body: [
      'Halve, peel and slice the onions thin, about ⅛ inch.',
      'Your largest heavy pan on medium, 6. Butter and oil in; when the butter foams, add the onions and the salt.',
      'Stir now and then until they collapse and go glossy.',
    ],
    timers: [{ key: 'onions-soften', label: 'Onions: soften', secs: 600 }],
  },
  {
    id: 'onions-slow',
    section: 'Start here',
    title: 'Turn the onions down low',
    body: [
      'Drop to 3–4, a lazy sizzle, not a fry. They cook while you do everything else.',
      'Every 5 minutes or so, stir and scrape the brown film off the bottom. That film is the flavor.',
      'If it starts to catch, splash in 2 tbsp of water and scrape.',
      'Done at deep amber and jammy. A small splash of red wine vinegar at the end wakes them up. Then keep them on the lowest heat.',
    ],
    timers: [{ key: 'onions-slow', label: 'Onions: low and slow', secs: 2700 }],
  },
  {
    id: 'sauce',
    section: 'Start here',
    title: 'Make the special sauce',
    items: ['24 oz sour cream', '¾ cup ketchup', '½ cup sweet relish', '3 tbsp pickle brine',
      '1½ tsp paprika', '1½ tsp onion powder', '1 tsp garlic salt', 'Black pepper'],
    body: [
      'Whisk everything until smooth and evenly pink.',
      'Taste it: more relish for sweeter, more brine for tangier.',
      'Cover and chill. It is better after 30 minutes, and it is both the burger sauce and the dip.',
    ],
  },
  {
    id: 'fries-cut',
    section: 'Prep',
    title: 'Cut the fries and start the soak',
    items: ['5 lb russet potatoes', 'A big bowl of cold water'],
    body: [
      'Turn the oven on to 450°F now, so it is hot later.',
      'Scrub the potatoes and leave the skins on.',
      'Waffle cut about ¼ inch: one pass, a quarter turn, the next pass. Straight into the cold water as you go.',
      'Soak at least 30 minutes. Rinsing off the starch is what makes them crisp.',
    ],
    timers: [{ key: 'fries-soak', label: 'Fries: soak', secs: 1800 }],
  },
  {
    id: 'rings-soak',
    section: 'Prep',
    title: 'Slice the onion rings and soak them',
    items: ['4 sweet onions', '1 quart buttermilk', '2 eggs'],
    body: [
      'Slice crosswise about ½ inch thick and pop the rounds apart into rings. Any thinner and the onion disappears into the crust.',
      'Whisk the buttermilk and eggs, push the rings under, and let them soak 30–45 minutes.',
    ],
    timers: [{ key: 'rings-soak', label: 'Rings: soak', secs: 1800 }],
  },
  {
    id: 'rings-station',
    section: 'Prep',
    title: 'Set up the ring station',
    items: [
      'Dredge: 1 cup flour, ¼ cup cornstarch, 1 tbsp paprika, 1 tbsp onion powder, 1 tsp garlic salt, pepper',
      'Batter: 1½ cups flour, ½ cup cornstarch, 1 tsp baking powder, about 1½ cups cold lager',
      'A rack over a sheet pan',
    ],
    body: [
      'Whisk the dredge in a wide dish next to the fryer.',
      'Keep the lager in the fridge. Mix the batter only when you start frying, to the thickness of heavy cream. A few lumps are fine; cold and fizzy is what makes it light.',
      'Set the rack beside the fryer for draining.',
    ],
  },
  {
    id: 'toppings',
    section: 'Prep',
    title: 'Toppings, cheese and buns',
    items: ['4–5 beefsteak tomatoes', 'Lettuce', 'Pickle chips', 'Gruyère and Cheddar slices', 'Potato buns', 'Butter, softened'],
    body: [
      'Slice the tomatoes about ¼ inch and give them a pinch of salt.',
      'Wash the lettuce and get it bone dry. Wet lettuce makes a soggy bun.',
      'Drain the pickles and keep the brine. Separate the cheese slices and keep them cold.',
      'Split the buns and soften the butter for brushing.',
    ],
  },
  {
    id: 'beef',
    section: 'Prep',
    title: 'Roll the beef',
    items: ['Ground beef, about 4 oz a ball'],
    body: [
      'Divide into 4 oz balls. Handle lightly and do not pack them; loose beef smashes into a lacy, crusty edge.',
      'Onto a parchment-lined tray and into the fridge until they hit the pan.',
      'Do not salt them yet. Salt added early turns the beef springy.',
    ],
  },
  {
    id: 'fire',
    section: 'Fire up',
    title: 'Fire up the fryer and the first fries',
    body: [
      'Deep fryer on to 375°F. Check the fill line.',
      'Drain the fries and dry them really well with towels. Wet fries steam instead of crisping.',
      'Toss with canola, about 2 tbsp a tray, plus salt and pepper. One layer on the sheet pans, with room between.',
      '450°F, flip halfway, 20–25 minutes in all, until deep golden. Salt them again straight out of the oven and never cover them.',
      'Start another tray whenever the last one comes out.',
    ],
    timers: [
      { key: 'fries-flip', label: 'Fries: flip', secs: 660 },
      { key: 'fries-done', label: 'Fries: done', secs: 660 },
    ],
  },
  {
    id: 'patties',
    section: 'Every order',
    title: 'Smash the patties',
    body: [
      'Skillet on 7 with a thin film of canola, hot until it shimmers.',
      'Ball in, then one hard smash with a stiff spatula to about ½ inch. Salt and pepper the top right away.',
      'Leave it alone 3–4 minutes, until the edge is deep brown and crusty.',
      'Flip, scraping the crust up with it. Cheese on: one slice per patty, and a double with both cheeses gets one of each.',
      '2 more minutes; the thickest one should read 160°F. Never press after the smash.',
    ],
    timers: [
      { key: 'patty-flip', label: 'Patties: flip', secs: 210 },
      { key: 'patty-done', label: 'Patties: done', secs: 120 },
    ],
  },
  {
    id: 'buns',
    section: 'Every order',
    title: 'Toast the buns',
    body: [
      'Brush the cut sides with butter.',
      'Cut side down on the center griddle, medium, 45–60 seconds, until golden. Watch them; potato rolls brown fast.',
    ],
    timers: [{ key: 'buns', label: 'Buns', secs: 50 }],
  },
  {
    id: 'eggs',
    section: 'Every order',
    title: 'Fry the eggs',
    body: [
      'Nonstick pan on 5 with a knob of butter. Crack in, then salt and pepper.',
      'Runny: 2–3 minutes, until the white is set and the yolk still wobbles. A lid for the last 30 seconds sets the top of the white.',
      'Hard: flip at 2 minutes and give it 2 more, yolk broken.',
    ],
    timers: [
      { key: 'egg-runny', label: 'Runny egg', secs: 150 },
      { key: 'egg-hard', label: 'Hard egg', secs: 240 },
    ],
  },
  {
    id: 'rings',
    section: 'Every order',
    title: 'Fry the onion rings',
    body: [
      'Mix the batter if it is not mixed yet.',
      'Lift rings out of the buttermilk and let them drip. Dredge until chalky, shake, then dip in the batter and let it drip.',
      'Into the 375°F oil, 6–8 at a time. Crowding drops the oil temperature and makes them greasy.',
      '3–4 minutes, turning once, until deep golden. Onto the rack and salt them the second they come out; salt only sticks while they are glossy.',
    ],
    timers: [{ key: 'rings', label: 'Onion rings', secs: 210 }],
  },
  {
    id: 'shakes',
    section: 'Every order',
    title: 'Milkshakes',
    body: [
      'Vanilla: ice cream and milk to the lines in a Creami pint, then Milkshake.',
      'Oreo: the same, with crushed Oreos in.',
    ],
  },
];
