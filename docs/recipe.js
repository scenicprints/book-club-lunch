// Cooking mode: the whole lunch as one recipe, in the order Kevin cooks it.
// Onions go on first and cook while everything else happens, the sauce is
// made while they soften, then the prep, then the fryer and oven, then the
// things made for every order. Amounts are for 8 with seconds, in grams
// (spices stay in tsp/tbsp), and every step repeats the amount it uses so
// nothing has to be looked up. Methods for the onions and rings come from
// his Pantry recipes; stove numbers are his 0–10 dial. Timers are per step,
// keep counting when you move on, and ring when they finish.

export const SECTIONS = ['Start here', 'Prep', 'Fire up', 'Every order'];

export const STEPS = [
  {
    id: 'onions-start',
    section: 'Start here',
    title: 'Start the onions',
    items: ['1,000 g yellow onions (about 4)', '30 g butter', '15 g canola', 'Big pinch of salt'],
    body: [
      'Halve, peel and slice the 1,000 g of onions thin, about 3 mm.',
      'Your largest heavy pan on medium, 6. In go 30 g butter and 15 g canola; when the butter foams, add the onions and the salt.',
      'Stir now and then until they collapse and go glossy.',
    ],
    timers: [{ key: 'onions-soften', label: 'Onions: soften', secs: 600 }],
  },
  {
    id: 'onions-slow',
    section: 'Start here',
    title: 'Turn the onions down low',
    items: ['30 g water, if they catch', '15 g red wine vinegar'],
    body: [
      'Drop to 3–4, a lazy sizzle, not a fry. They cook while you do everything else.',
      'Every 5 minutes or so, stir and scrape the brown film off the bottom. That film is the flavor.',
      'If it starts to catch, add 30 g water and scrape.',
      'Done at deep amber and jammy. Stir in 15 g red wine vinegar at the end to wake them up. Then keep them on the lowest heat.',
    ],
    timers: [{ key: 'onions-slow', label: 'Onions: low and slow', secs: 2700 }],
  },
  {
    id: 'sauce',
    section: 'Start here',
    title: 'Make the special sauce',
    items: ['680 g sour cream', '205 g ketchup', '125 g sweet relish', '45 g pickle brine',
      '1½ tsp paprika', '1½ tsp onion powder', '1 tsp garlic salt', 'Black pepper'],
    body: [
      'Into a bowl: 680 g sour cream, 205 g ketchup, 125 g sweet relish, 45 g pickle brine, 1½ tsp paprika, 1½ tsp onion powder, 1 tsp garlic salt and a few grinds of pepper.',
      'Whisk until smooth and evenly pink.',
      'Taste it: more relish for sweeter, more brine for tangier, 10 g at a time.',
      'Cover and chill. It is better after 30 minutes, and it is both the burger sauce and the dip.',
    ],
  },
  {
    id: 'fries-cut',
    section: 'Prep',
    title: 'Cut the fries and start the soak',
    items: ['2,300 g russet potatoes', 'About 4,000 g cold water, enough to cover'],
    body: [
      'Turn the oven on to 450°F now, so it is hot later.',
      'Scrub the 2,300 g of potatoes and leave the skins on.',
      'Fill a big bowl with about 4,000 g cold water.',
      'Waffle cut about 6 mm: one pass, a quarter turn, the next pass. Straight into the cold water as you go, and add more water if they are not covered.',
      'Soak at least 30 minutes. Rinsing off the starch is what makes them crisp.',
    ],
    timers: [{ key: 'fries-soak', label: 'Fries: soak', secs: 1800 }],
  },
  {
    id: 'rings-soak',
    section: 'Prep',
    title: 'Slice the onion rings and soak them',
    items: ['1,400 g sweet onions (about 4)', '975 g buttermilk', '100 g egg (2 large)'],
    body: [
      'Slice the 1,400 g of onions crosswise about 12 mm thick and pop the rounds apart into rings. Any thinner and the onion disappears into the crust.',
      'In a big bowl, whisk 975 g buttermilk with 100 g egg (2 large eggs) until even.',
      'Push the rings under and let them soak 30–45 minutes.',
    ],
    timers: [{ key: 'rings-soak', label: 'Rings: soak', secs: 1800 }],
  },
  {
    id: 'rings-station',
    section: 'Prep',
    title: 'Set up the ring station',
    items: [
      'Dredge: 125 g flour, 30 g cornstarch, 1 tbsp paprika, 1 tbsp onion powder, 1 tsp garlic salt, pepper',
      'Batter: 190 g flour, 65 g cornstarch, 4 g baking powder, about 355 g cold lager (one bottle)',
      'A rack over a sheet pan',
    ],
    body: [
      'Dredge: whisk 125 g flour, 30 g cornstarch, 1 tbsp paprika, 1 tbsp onion powder, 1 tsp garlic salt and some pepper in a wide dish next to the fryer.',
      'Batter: weigh 190 g flour, 65 g cornstarch and 4 g baking powder into a bowl and set it by the fryer. Keep the 355 g of lager in the fridge.',
      'Pour in the lager only when you start frying, to the thickness of heavy cream. A few lumps are fine; cold and fizzy is what makes it light.',
      'Set the rack beside the fryer for draining.',
    ],
  },
  {
    id: 'toppings',
    section: 'Prep',
    title: 'Toppings, cheese and buns',
    items: ['1,000 g beefsteak tomatoes (4–5)', '300 g lettuce', '300 g pickle chips, drained',
      'Gruyère and Cheddar, 20 g a slice', 'Potato buns', '80 g butter, softened'],
    body: [
      'Slice the 1,000 g of tomatoes about 6 mm and give them a pinch of salt.',
      'Wash the 300 g of lettuce and get it bone dry. Wet lettuce makes a soggy bun.',
      'Drain 300 g of pickle chips and keep the brine. Separate the cheese slices, 20 g each, and keep them cold.',
      'Split the buns and set out 80 g butter to soften for brushing.',
    ],
  },
  {
    id: 'beef',
    section: 'Prep',
    title: 'Roll the beef',
    items: ['Ground beef, 115 g a ball'],
    body: [
      'Divide into 115 g balls. Handle lightly and do not pack them; loose beef smashes into a lacy, crusty edge.',
      'Onto a parchment-lined tray and into the fridge until they hit the pan.',
      'Do not salt them yet. Salt added early turns the beef springy.',
    ],
  },
  {
    id: 'fire',
    section: 'Fire up',
    title: 'Fire up the fryer and the first fries',
    items: ['25 g canola a tray', 'Salt and pepper'],
    body: [
      'Deep fryer on to 375°F. Check the fill line.',
      'Drain the fries and dry them really well with towels. Wet fries steam instead of crisping.',
      'Toss each tray with 25 g canola, plus salt and pepper. One layer on the sheet pans, with room between.',
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
    items: ['115 g beef ball per patty', '5 g canola a skillet', '20 g cheese slice per patty', 'Salt and pepper'],
    body: [
      'Skillet on 7 with 5 g canola, hot until it shimmers.',
      'A 115 g ball in, then one hard smash with a stiff spatula to about 12 mm. Salt and pepper the top right away.',
      'Leave it alone 3–4 minutes, until the edge is deep brown and crusty.',
      'Flip, scraping the crust up with it. Cheese on: one 20 g slice per patty, and a double with both cheeses gets one of each. Extra is one more 20 g slice.',
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
    items: ['5 g softened butter a bun'],
    body: [
      'Brush the cut sides with 5 g butter a bun.',
      'Cut side down on the center griddle, medium, 45–60 seconds, until golden. Watch them; potato rolls brown fast.',
    ],
    timers: [{ key: 'buns', label: 'Buns', secs: 50 }],
  },
  {
    id: 'eggs',
    section: 'Every order',
    title: 'Fry the eggs',
    items: ['1 large egg per burger', '5 g butter an egg', 'Salt and pepper'],
    body: [
      'Nonstick pan on 5 with 5 g butter for each egg going in. Crack in, then salt and pepper.',
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
    items: ['Soaked rings', 'The dredge and batter from the ring station', 'Salt'],
    body: [
      'Batter not mixed yet? Pour the 355 g of cold lager into the 190 g flour, 65 g cornstarch and 4 g baking powder and whisk to heavy cream.',
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
    items: ['200 g vanilla ice cream a shake', '120 g whole milk a shake', '35 g Oreos a shake (3 cookies), for Oreo'],
    body: [
      'Vanilla: 200 g ice cream and 120 g milk in a Creami pint, then Milkshake.',
      'Oreo: the same 200 g ice cream and 120 g milk, plus 35 g crushed Oreos (3 cookies), then Milkshake.',
    ],
  },
];
