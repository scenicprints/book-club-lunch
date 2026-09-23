# Book Club Lunch: order-at-the-table site

A one-off site for one lunch: **Book Club Lunch, Saturday 2026-09-26, 8 guests.**
Guests scan a QR code on the table, build their burger/sides/shake on their
phone, and the order lands as a ticket on Kevin's iPad in the kitchen. Kevin
cooks exactly what's on the ticket and taps **Order up!** to clear it.

No app to install. It's a plain web page on GitHub Pages; Firebase is
the invisible drop-off point between the guests' phones and the iPad.

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
`readyMs` only exists once it's been marked done.

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
const { connect } = await import('./fb.js?v=3');
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
