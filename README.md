# Book Club Lunch: order-at-the-table site

A one-off site for one lunch: **Book Club Lunch, Saturday 2026-09-26, 8 guests.**
Guests scan a QR code on the table, build their burger/sides/shake on their
phone, and the order lands as a ticket on Kevin's iPad in the kitchen. Kevin
cooks exactly what's on the ticket and taps **Order up!** to clear it.

No app to install. It's a plain web page on GitHub Pages; Firebase is
the invisible drop-off point between the guests' phones and the iPad.

**This site replaces the Pantry app for this lunch.** Kevin is cooking from
the kitchen screen, not from the Pantry app's chef. Don't update the
`host_brief.json` brief in `scenicprints/pantry-data` for changes here.

| Page | URL | Who |
|---|---|---|
| Guest menu | https://scenicprints.github.io/book-club-lunch/ | Guests (the QR code points here) |
| Kitchen | https://scenicprints.github.io/book-club-lunch/kitchen.html | Kevin's iPad |
| Table sign | https://scenicprints.github.io/book-club-lunch/qr.html | Print it; the QR code for the table |

Add `?event=test` to any of the three to use a scratch event that never
touches the real lunch's orders (e.g. `kitchen.html?event=test`).

---

## What's on the menu (decided with Kevin — don't change without asking)

- **Burger**: thick smashed patty, cooked through. Guests customise it; Kevin
  builds it 100% to the ticket.
  - Patties: **Single / Double**
  - Cheese: **Gruyère**, **American**, each No / Yes / Extra (both, one, or none)
  - Fried egg: **No egg / Runny / Hard**
  - Toppings: **Caramelized onion, Pickles, Tomato, Lettuce**, each No / Yes / Extra
  - Sauces: **Special sauce, Ketchup, Mayo, Mustard**, each No / Yes / Extra
  - Quantity per burger (a guest can order 2 of the same build)
  - The builder opens on the house burger: single, Gruyère, caramelized onion, special sauce.
- **Sides**: Fries, Onion rings (quantity each)
- **Milkshakes**: Vanilla, Oreo (quantity each)
- **Special requests** free-text box on every order
- Guests type their **name**; they can **order again** for seconds.

**Decided against (don't add back):**
- ❌ "Your order is ready" alert on the guest's phone. Kevin dropped it.
  Guests just see "Order's in!" and what they sent.
- ❌ A running patty counter on the iPad. Kevin will make sure there's enough.
- ❌ Brand names/logos. The look is 1950s diner, In-N-Out-*inspired*, but no
  trademarks.
- ❌ Neon on a black board. Neon sits straight on the cream background.
- ❌ **Step-by-step cook mode** (tabs, griddle rounds, smash/flip/pull steps,
  build cards, a rail column). It was built (commit 41bb21e) and Kevin
  pulled it: *"too complicated to follow… I don't need to follow directions
  to a T when I'm on my fifth burger."* **Keep the kitchen to one screen.**

## The kitchen (Kevin is cooking alone): ONE screen

- **Tickets on the rail**, oldest first, each with **Order up!**. Landscape
  iPad fits 4 across.
- **Prep list** button in the top bar opens the before-service checklist
  (`PREP` in `cook.js`); some items have a timer button. Ticks are saved on
  the iPad. The badge counts what's left.
- **Timer dock** along the bottom: fries, onion rings, onions, flip the
  patties, patties done, runny eggs, hard eggs, all under **+ Timer**. A done
  timer rings until tapped. ⚙ sets the timer lengths (defaults in
  `DEFAULTS`, cook.js).

**Kitchen facts Kevin gave:**
- **Breaker:** the deep fryer and the griddle together trip the breaker. The
  air fryer, Tovala, griddle and slow cooker are one-at-a-time too. So rings
  are all fried during prep and held in the oven, and the fryer goes OFF
  before the griddle goes on. The air fryer isn't used at all.
- Fries are oven fries. Rings are from the **deep fryer**.
- **Cheese:** one slice per patty. A double with both cheeses gets one of
  each. (The ticket just lists the cheeses; Kevin knows the rule.)

## The look

1950s diner: cherry red `#D32F3A`, cream `#FFF6E4`, ink `#1F1A17`, yellow
`#FFC62C`, mint `#A8DCCB`, chrome. Red/white striped awning on top, a
checkerboard strip above the bottom button, neon-script headings (Yellowtail)
and menu-board caps (Oswald). The burger builder draws a live CSS burger
stack that updates as you toggle ingredients. The kitchen is a
checkerboard floor with pale-green paper guest checks hanging from a chrome
rail; new tickets swing on and a bell dings.

---

## How it's built

Plain HTML + CSS + ES modules in `docs/`, no build step, no npm. Served by
GitHub Pages from `main` / `docs`.

```
docs/
  index.html   guest page shell        → guest.js
  kitchen.html kitchen page shell      → kitchen.js
  qr.html      printable table sign (QR via qrcode-generator from jsdelivr)
  menu.js      the menu + how a burger reads back (shared by both pages)
  fb.js        Firebase connection + the ?event= switch
  bell.js      the new-order ding (Web Audio, no sound file)
  cook.js      the prep list and timer defaults
  timers.js    the timer dock (saved end times, rings until tapped)
  styles.css   all styling (guest, builder, kitchen, sign)
```

### Firebase

- Reuses Kevin's existing **`foos-6ecf3`** project (the one behind Foos and
  Parchís). The web config in `fb.js` is the public client config, already
  public in those repos; it is not a secret.
- **Anonymous auth** (invisible, no login). Firestore rules already allow
  signed-in users to read/write `leagues/{id}/**`, which is why orders live at:
  `leagues/book-club-lunch-2026-09-26/orders/{orderId}`
  (tests: `leagues/test/orders/...`). No console/rules changes were needed.

### Order document

```json
{
  "name": "Ada",
  "burgers": [{
    "qty": 1, "patties": "double", "egg": "runny",
    "cheese":   { "gruyere": "regular", "american": "extra" },
    "toppings": { "onion": "regular", "pickles": "none", "tomato": "regular", "lettuce": "none" },
    "sauces":   { "special": "regular", "ketchup": "none", "mayo": "none", "mustard": "extra" }
  }],
  "extras": { "fries": 1, "oreo": 1 },
  "notes": "cut in half",
  "status": "new",
  "createdMs": 1790200000000,
  "createdAt": "<server timestamp>",
  "readyMs": 1790200600000
}
```
Levels are `none | regular | extra`. `status` goes `new` → `ready` when Kevin
taps **Order up!** (the kitchen's "Put back" sets it to `new` again).
`readyMs` only exists once it's been marked done. (Orders made while cook mode
was live may also carry a `built` list; nothing reads it now.)

Guest-side details: the order id is created before sending, so re-tapping
Send after a timeout rewrites the same order instead of making a duplicate.
The guest's name and what they've sent are remembered in `localStorage`
(keyed by event).

Kitchen details: tickets are numbered by arrival (#1, #2…), shown oldest
first; a new ticket rings the bell (only after "Open the kitchen" is tapped;
browsers require a tap before audio) and the screen is kept awake with the
Wake Lock API.

---

## Working on it

1. Edit files in `docs/`.
2. **Bump `?v=N`** everywhere it appears (`index.html`, `kitchen.html`,
   `qr.html`, and the `import … from './x.js?v=N'` lines in `guest.js` /
   `kitchen.js`). Otherwise phones keep the old copy.
3. Push to `main`. Pages rebuilds in ~1 min.
4. **GitHub Pages caches `index.html` ~10 min.** When checking a deploy,
   load `…/?event=test&bust=<random>` or you'll be looking at the old build.
5. Test against `?event=test` only. Never put test orders in the real
   event. Clean up test orders afterward (see below).

### Clearing test orders

Open `kitchen.html?event=test` in a browser, open the dev console, and run:
```js
const { connect } = await import('./fb.js?v=5');
const { fs, orders } = await connect();
for (const d of (await fs.getDocs(orders)).docs) await fs.deleteDoc(d.ref);
```

## Related

- The dinner brief for Kevin's Pantry app (what the app's chef shops and
  preps for) is in `scenicprints/pantry-data` → `host_brief.json`, brief
  named "Book Club Lunch". It carries the same menu decisions.

## Status

See the **Status log** at the bottom. Add a line whenever you ship something.

### Status log
- 2026-09-23: v1 built and deployed: guest menu, burger builder with live
  burger drawing, kitchen ticket rail, printable QR sign.
- 2026-09-23: v2: neon signs (guest, kitchen, table sign); removed the
  explanation line from the guest front page (Kevin's call).
  `kitchen-qr.png` opens the kitchen on the iPad; `book-club-lunch-qr.png`
  is the guest QR.
- 2026-09-23: v3: neon sits straight on the cream background. Kevin did
  NOT like it on a black board, so don't bring the dark board back. (The
  kitchen's full-width dark top bar is unchanged.)
- 2026-09-23: v4: kitchen Cook mode (rounds, griddle map, build cards,
  plating), Prep checklist, timer dock, settings. Kevin cooks alone; the site
  replaces the Pantry app for this lunch.
- 2026-09-23: v5: cook mode REMOVED at Kevin's request. Kitchen is one screen
  again: tickets + Prep list button + timer dock + ⚙ timer lengths.
