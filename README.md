# Book Club Lunch: order-at-the-table site

A one-off site for one lunch: **Book Club Lunch, Saturday 2026-09-26, 8 guests.**
Guests scan a QR code on the table, build their burger/sides/shake on their
phone, and the order lands as a ticket on Kevin's iPad in the kitchen. Kevin
cooks exactly what's on the ticket and taps **Order up!** to clear it.

No app to install. It's a plain web page on GitHub Pages; Firebase is
the invisible drop-off point between the guests' phones and the iPad.

**Split of jobs:** this site takes the orders and runs the kitchen during
the lunch. The **Pantry app** (brief: `host_brief.json` in
`scenicprints/pantry-data`, named "Book Club Lunch") is what Kevin preps from.

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
- **Gott's Roadside Burger** one-tap button (Kevin's name for it): the house burger (single, Gruyère,
  caramelized onion, special sauce) **plus fries**. "+ Build your own" opens
  the builder.
- **The tray**: a drawing at the top of the order screen: fries carton and
  onion rings on one side, the burger in the middle, milkshake glass(es) on
  the other side, each dropping in as it's added (×N when more than one).
  Hidden when the order is empty. It's sticky: scrolling down the menu, it
  pins near the top of the screen; scrolling back up, it settles into its
  place and goes no higher.
- **Runny egg** on the burger drawing: yolk oozes down the side.
- **Your number**: after sending, the guest sees their ticket number big
  ("#4"), the same number as the kitchen ticket, so Kevin can call it out.
  Both sides number orders by server time (`placedAt()` in menu.js).
- The guest's burger summary lists only what's on it (no "No egg" lines).
- **Place in line**: under "Your number", a live line: "2 orders ahead of you",
  then "You're next". It counts unserved orders placed before theirs, and
  disappears once theirs is served (no "ready" alert).
- **Book fact**: a "While you wait" card on the "Order's in!" screen with one
  fact about the book (Normal People by Sally Rooney), a new one per order and
  never repeated on the same phone. The facts are in `book.js`; every one was
  checked against two independent sources or one primary source, nothing past
  the opening premise, and no quotes from the novel.

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
- ❌ Running/ringing timers. Kevin wants *reminders* of heat + how long, not timers.
- ❌ Page scrolling on the kitchen screen.
- ❌ Crossing burgers off a ticket, and reading orders aloud. Both turned down.
- ❌ "Same again" reorder button, and a guest-check review screen before sending. Both turned down.
- ❌ Letter-board menu headers. Mocked up; Kevin prefers the original dashed-line headers.
- ❌ Quick-request chips above Special requests (Cut in half, Sauce on the side,
  Extra crispy). Built in v15, removed in v16: Special requests is just the typing box.
- ❌ A prep checklist on the kitchen screen. Kevin preps from the Pantry app
  (its brief is `host_brief.json` in `scenicprints/pantry-data`).
- ❌ A Wi-Fi QR code on the table sign.

## The kitchen (Kevin is cooking alone): ONE screen, NO page scrolling

Three bands, top to bottom (Kevin's layout, 2026-09-23):

1. **Top rail: patties to cook.** Every patty on open tickets that isn't on
   the griddle yet, grouped by the cheese that goes on it, with counts:
   `5× Gruyère · 2× American · 1× American + American · 1× No cheese`.
   A double with Gruyère + American shows as one Gruyère patty and one
   American patty. Extra cheese = one more slice on that patty
   (`pattyCheese()` in kitchen.js). Why: fries and rings cook constantly,
   but patties are cooked to order in batches. Kevin cooks what the rail
   says, then assembles tickets from that batch while the next batch cooks.
   **On the griddle ✓** marks every order currently counted as cooking
   (`cooking: true` on the order doc); the rail then shows only newer
   orders' patties. Those tickets get a 🔥 tag; tapping it puts them back.
2. **Middle: tickets** side by side on a rail (swipes sideways if more than
   fit). Each ticket's **Order up!** is pinned to its bottom. Tickets list
   only what's on the burger. **↶ Put back** in the header undoes the last
   Order up.
3. **Bottom rail: heat & time.** White pill chips on the silver bar (the
   first design; Kevin liked it; don't restyle it). Each pill is two short
   lines (name over numbers) so all 7 sit in **one row** on Kevin's iPad:
   an **A16, 1180×820 in landscape**. He doesn't want them stacked. Heat is °F or his stove's
   0–10 dial: Parboil fries 9–10 → 3–4, 8–10 min · Fries 450°F 25, flip,
   15–20 min · Rings 375°F 3–4 min · Patties 7 3–4, flip, 2 min, 160°F ·
   Runny egg 5 2–3 min · Hard egg 5 4 min, flipped · Buns Medium 45–60 sec.
   Numbers come from his Pantry recipes (`REMINDERS`, cook.js). **⚙ lives in
   the top bar, not on this rail.** It edits these; clearing both boxes hides one.

**Full screen on the iPad (v19):** `kitchen.html` is a Home Screen web app
(`kitchen.webmanifest`, `apple-mobile-web-app-capable`, black-translucent
status bar, `kitchen-icon-*.png` = neon script "K" on a dark tile with a
checkerboard strip). Safari → Share → **Add to Home Screen** → open it from
the icon: no address bar or tabs. The top bar pads for the status bar with
`env(safe-area-inset-top)`. A Home Screen icon made before v19 has to be
removed and added again to pick this up.

**Top-bar controls on the iPad** (added v15):
- **Sold out**: switches for every orderable thing (burgers, each cheese, eggs,
  each topping and sauce, fries, rings, each shake). Guests' phones grey it out
  live; a side already in a guest's tray is taken off with a notice; a burger
  using a sold-out ingredient can't be sent until it's changed. Gott's Roadside
  Burger is disabled if burgers, Gruyère, caramelized onion or special sauce are
  out; if only fries are out, it's added without fries.
- **Close kitchen** (asks first) / **Reopen**: closed = guests see "Kitchen's
  closed, thanks for coming!" instead of the menu. Tickets already on the rail
  stay. Once closed and the rail is empty, the middle shows **the scoreboard**
  (burgers, doubles, patties, fried eggs, sides, shakes, guests; zeros hidden).
- **Ticket ageing**: a ticket's edge goes amber at 10 minutes, red at 15.
- Sold-out and closed live in `leagues/<event>/kitchen/state`
  (`{ soldOut: { id: true }, closed, closedMs }`); both pages listen to it.

**Kitchen facts Kevin gave (don't guess past these; check his Pantry data first):**
- Fries are **fresh-cut russets** (parboiled, then oven). Onion rings are
  **fresh, beer-battered**, from the **deep fryer**. Nothing is frozen.
- **The electric griddle is NOT used.** It shares a breaker problem with the
  deep fryer, and the fryer runs all lunch, so rings are fried as orders
  come in (no holding them in the 450°F oven). Patties and eggs are cooked
  in **skillets on the stovetop**. Buns go on the **center griddle built into
  the stovetop**.
- **Cheese:** one slice per patty. A double with both cheeses gets one of
  each. "Extra" is one more slice.
- Kevin's **Pantry recipes** live in `scenicprints/pantry-data` →
  `host_hub.json` (the built "Book Club" event) and `pantry.json`. That built
  event is an OLDER plan (16 guests, outdoor grill, brioche, mayo sauce);
  the brief matching this site ("Book Club Lunch", `host_brief.json`) was
  updated 2026-09-23 to match everything here (stovetop skillet patties and
  eggs, buns on the stovetop center griddle, fresh-cut oven fries, rings
  fried to order in the deep fryer, no electric griddle, cheese per patty).
  Kevin builds it in Pantry's Host Hub to get the prep plan.

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
  cook.js      where/heat/time reminders for the bottom rail
  book.js      the book and its facts for the guest's wait
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
  "readyMs": 1790200600000,
  "cooking": true
}
```
Levels are `none | regular | extra`. `status` goes `new` → `ready` when Kevin
taps **Order up!** (the kitchen's "Put back" sets it to `new` again).
`readyMs` only exists once it's been marked done. `cooking` is set by the
kitchen's **On the griddle ✓** button. (Orders made while cook mode
was live may also carry a `built` list; nothing reads it now.)

Guest-side details: the page listens to every order for the lunch, which is
how it numbers the guest's orders and counts who's ahead. Orders deleted from
Firestore (a reset) disappear from the guest's phone too. The order id is created before sending, so re-tapping
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
const { connect } = await import('./fb.js?v=19');
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
- 2026-09-23: v6: prep list removed from the kitchen (Kevin preps from the
  Pantry app). Kitchen = tickets + timer dock + ⚙ timer lengths.
- 2026-09-23: v7: timers → timer reminders (no countdown); tickets hide
  anything not on the burger; "To cook" totals line for cooking everything
  at once.
- 2026-09-23: v8: kitchen is three fixed bands with no page scroll: top patty
  rail (grouped by cheese, "On the griddle ✓"), tickets on a sideways rail,
  bottom temps & times rail.
- 2026-09-23: v9: bottom rail = where + heat + time from Kevin's Pantry
  recipes (fresh fries, beer-battered rings in the deep fryer, skillet
  patties/eggs, buns on the stovetop center griddle). One row of cards.
- 2026-09-23: v10: bottom rail slimmed to a thin text strip (heat + time
  only); ⚙ moved to the top bar. About 62px on iPad, 63px on phone.
- 2026-09-23: v11: bottom rail back to the first (pill) design with the
  corrected numbers. The v9 cards and the v10 thin text strip were both
  rejected; Kevin had only corrected the info, not the design.
- 2026-09-23: v12: reminder pills are two lines (name over numbers), all in
  one row on the iPad A16 (1180 wide), about 66px tall.
- 2026-09-23: v13: guest side: The House + fries, tray drawing (fries/rings,
  burger, shakes), oozing runny yolk, big ticket number after sending, empty
  rows hidden. Letter-board menu headers: mockup shown, not built.
- 2026-09-23: v14: the one-tap burger is named "Gott's Roadside Burger".
  Letter-board headers declined; originals stay.
- 2026-09-23: v15: sold-out switches, close/reopen the kitchen with the
  end-of-lunch scoreboard, ageing tickets (amber 10 min, red 15), quick-request
  chips. 3D-printable QR SVGs in `qr-3d/`.
- 2026-09-23: v16: the one-tap burger is "Gott's Roadside Burger" ("Bott's" was a
  typo). Quick-request chips removed; Special requests is just the typing box.
- 2026-09-23: real event's orders reset (two of Kevin's test orders deleted), so
  the lunch starts at #1.
- 2026-09-23: v17: place in line on the "Order's in!" screen, a Normal People
  fact per order, and phones forget orders that were reset.
- 2026-09-23: Kevin's 7:31 PM test order deleted from the real event (still starts at #1).
- 2026-09-23: v18: the guest's tray is sticky while scrolling the menu.
- 2026-09-24: v19: the kitchen opens full screen from the iPad Home Screen
  (manifest, Apple web-app tags, neon "K" icon, status-bar padding).
