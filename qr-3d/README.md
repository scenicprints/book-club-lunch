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

## `neon-qr-sign.anvil`: the backlit sign, as an Anvil model

150 × 200 mm, built in Anvil by script (so every step is on the timeline):

| Body | Colour to print | What it is |
|---|---|---|
| Diffuser | white/natural, translucent | 1.6 mm back plate the light shines through (`diffuser`) |
| Neon rim | red, translucent | 5 mm band round the edge, 4 mm tall (`wallHeight`), glows |
| Frame and QR | black | frame 4 mm tall with the QR window and the lettering cut through; QR squares 2.4 mm (`qrHeight`) |

Lettering is real Anvil text: "BOOK CLUB" and "LUNCH IS ON" in Impact 9 mm,
"Scan to order" in Brush Script MT 26 mm. The QR in the model was read back
off the model's own top faces and decodes to the guest link. Each run of
QR squares is drawn 0.02 mm short top and bottom so no two runs share an
edge (otherwise the white gaps they enclose become regions and fill in).

Anvil bugs found building it (in scenicprints/anvil, not fixed here):
1. Once a sketch contains **text**, entering any other sketch throws
   "number N is not iterable" (`sketchModelSnaps` iterates `ent.p`, which is a
   single number for text). So the Lettering sketch is last on the timeline.
2. The SVG importer flips `<path>` Y but **not `<rect>`**, so rectangles land
   upside-down relative to paths in the same file. The QR is written as paths.

