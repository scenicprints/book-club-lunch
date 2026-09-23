# QR codes for 3D printing

| File | What |
|---|---|
| `guests-qr.svg` / `kitchen-qr.svg` | **What Kevin uses.** Filled black squares only (no background, no strokes, since slicers and Tinkercad drop strokes and a background would extrude as a solid block). 90 × 90 mm canvas; the code sits inside a 4-square blank border, so make the plate at least 90 mm. |
| `*-qr-base.stl` | The 90 × 90 × 2 mm plate. Print it in a **light** color. |
| `*-qr-code.stl` | The dark squares, 1 mm tall, sitting on top of the plate. Print in a **dark** color. Load both files together; they're already lined up. |
| `*-qr-combined.stl` | Plate + squares as one model, for a filament swap at 2 mm height instead of two colors. |

- **Guests** → https://scenicprints.github.io/book-club-lunch/ (41 × 41 squares, 1.84 mm each)
- **Kitchen** → https://scenicprints.github.io/book-club-lunch/kitchen.html (45 × 45 squares, 1.70 mm each). Keep it off the table.

Both use high error correction, so a rough edge or a stray blob still scans.
Keep the plain border around the code; scanners need it.
Verified: the STL squares drawn from above, and both SVGs, decode to the links above.
