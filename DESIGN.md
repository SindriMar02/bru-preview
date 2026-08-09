# Brú Guesthouse — "The Row"

**Design read:** twelve identical timber cottages standing in a line on a flat
plain at Brú, 861 Hvolsvöllur, ten kilometres from Seljalandsfoss. Self
check-in, family-run, 9.3/10 from 1,181 Booking.com reviews. Audience is
international couples and families basing themselves on the south coast for a
few nights. The page's single job: **make booking direct the obvious act.**

**Dials:** VARIANCE 7 · MOTION 6 · DENSITY 3.

Not a "premium stay" page. Their distinguishing feature is not luxury, it is
**repetition** — twelve of the same object, in a row, under an enormous sky.
`husin2.jpg` says it outright: a dead-straight gravel track running at the
mountains with the cottages reduced to a rhythm of small dark marks along the
horizon. That photograph is the brief.

---

## THE SIGNATURE — the row

One hairline runs at a constant height across the page. On it sit **twelve
marks**, one per cottage. It is the horizon from their own photograph, and it
is the only structural device the page uses.

It does three jobs, which is why it earns its place:

1. **Identity.** It is their building, abstracted to its plan: twelve equal
   things on one line.
2. **Navigation.** The mark for the section you are in is lit. Scrolling moves
   the light along the row, the way the cottages' windows come on at dusk in
   `husinumnott.jpg`.
3. **The product.** In the booking section the same twelve marks become the
   **availability strip** — lit is free, dim is taken. In the owner dashboard
   it is the same object again, now editable.

**The signature and the software are the same object.** That is what makes this
a package pitch rather than a website with a form bolted on.

**Do not** also give the page a pinned canvas film, a wordmark crossing and a
palette scrub. One device, executed precisely. Chanel's rule: take one thing
off before leaving.

---

## The arc

Their photo set contains the same subject in **day, dusk, lit-at-night and
aurora**. So one scroll is one evening, and the arc is earned by the assets
rather than transplanted from [[mirrorhouse-design-system]]:

`day (grey sky) → the plain → dusk → windows lit → aurora`

The palette scrubs along that arc. Ink and canvas cross fast through mid-tone
so no body copy ever sits inside the crossover (Mirror House's hard-won rule).

---

## Tokens

### Palette — sampled from their own photographs, never chosen

| Token | Hex | Sampled from |
|---|---|---|
| `--bru-larch` | `#75614C` | cottage cladding, mean of `husid.jpg` wall |
| `--bru-larch-lit` | `#A0896E` | sunlit face of the same wall |
| `--bru-larch-deep` | `#342C22` | its shadow side |
| `--bru-plain` | `#635A3D` | the dry olive grass, `husin.jpg` |
| `--bru-plain-lift` | `#776F47` | the same grass in sun |
| `--bru-sky` | `#CFD2DB` | overcast sky, `husin.jpg` top third |
| `--bru-sky-deep` | `#788191` | its weather |
| `--bru-night` | `#11101E` | `husinumnott.jpg`, blue-violet not black |
| `--bru-night-deep` | `#0A0916` | the darkest sky in that frame |
| `--bru-window` | `#534139` | the glow of a lit cottage, same frame |
| `--bru-aurora` | `#366E29` | `nordurljos.jpg`, the accent, used ONCE per screen |

Warm larch against a dry olive plain under a cold grey sky, resolving to
blue-violet night with one green. **Explicitly not** the banned
beige/brass/espresso premium-consumer default, and nothing from Brúin's
iron-oxide family — [[no-style-bleed-between-designs]].

### Type

- **Display: Technor Medium.** Squared bowls, flat sides, hard corners — the
  letterform IS the flat-roofed timber box. Subject-derived, not a taste pick.
  Medium only; Bold reads gamer-ish at size.
- **Body: Synonym Regular / Medium.** Quiet and low-contrast so the landscape
  carries the page.
- Used in no previous build (Brúin: Clash + Switzer · Glass House: Cabinet
  Grotesk · Svartaborg: Familjen Grotesk).
- Both pass the Icelandic glyph gate (Þ þ Ð ð Æ æ Ö ö and all acutes) — checked
  with fontTools, not assumed. **Range was rejected at this gate**: the library
  copy is a woff2 subset with no Icelandic at all.
- Tracking: -0.02em display, -0.01em headings, 0 body.

### Geometry

- **Radius 0.** The cottages are hard-edged boxes; so is the page.
- Self-hosted woff2 only. No CDN.

---

## Structure (8 sections)

1. **Hero — the row.** `husin2.jpg` full bleed: the track, the mountains, the
   twelve marks on the horizon. Wordmark BRÚ set on the horizon line itself.
2. **The plain** — where they are, in one paragraph. 10 km to Seljalandsfoss,
   Vík, the Golden Circle, Vestmannaeyjar. Their own site never states the
   address; ours does.
3. **The film** — pinned, scrubbed. One Higgsfield dolly along the row at dusk.
   Per ledger #94: **direct the camera, never lock it.**
4. **The cottages** — three real types with real numbers: Standard 25 m² sleeps
   4 · Superior 37 m² sleeps 4 · Superior Double 37 m² sleeps 2. Real interiors.
5. **Inside** — kitchenette, private bathroom, terrace, mountain view, EV
   charging. Their own list, nothing invented.
6. **The night** — the aurora section. `husinumnott.jpg` + `nordurljos.jpg`.
   The only place the aurora green appears at full strength.
7. **Book direct** — the availability strip, working. The section the rebuild
   exists for.
8. **Find us** — map, contact, self check-in explained.

Plus `/dashboard` — the owner side. Two-sided demo, no backend, same row.

---

## Motion

Reduced-motion is a first-class path, never a discard
([[redesign-craft-ledger]] #74): the row still renders, lit marks still read,
the arc resolves to its midpoint palette.

Traps to respect from the ledger:
- Pin + later triggers: `refreshPriority`, never `refresh()` in a handler.
- `ScrollTrigger.update()` on `visibilitychange`, never `refresh()`.
- Any Frame outside a stretch context needs explicit `width:100%` or it
  collapses to 0 (#68 third costume).
- Headlines in narrow grid columns must be sized to the COLUMN, not the
  viewport (#96, learned on Brúin the hard way).

---

## Assets

**Have (11, all theirs):** the row `husin2` · a single cottage `husid` · the
cluster `husin` · night-lit `husinumnott` · aurora `nordurljos` · the bench and
raven weathervane `fjollin` · Seljalandsfoss (portrait) · three interiors ·
**a real logo** `brulogo.png` (252px, naive illustration — reproduce as clean
SVG, do not enlarge the raster).

All photographs are 1024×683. Upscale only what must go full-bleed, and only
from the largest source available.

**Do not have, and will not fake:** a photograph of the Superior Double as
distinct from the Superior, any exterior in summer green, any staff or guest
photography, real nightly rates. Rates on the page come from a range they
publish on OTAs and must be labelled as such, or omitted.

---

## The commercial spine

They sell through Booking.com, Expedia, Trip.com, Guide to Iceland, Key to
Iceland and guestreservations.com — six channels, each taking a cut, on a
business with 1,181 Booking.com reviews and twelve units.

A TripAdvisor guest wrote, under room tips: **"Book directly with the
Guesthouse!"**

And `bruguesthouse.is/book` returns **HTTP 404**. Their own booking link cannot
be opened directly, refreshed, shared or indexed — a missing SPA rewrite.

Their guests are already telling each other to book direct, and the door is
shut. That is the whole pitch, and section 7 is the answer to it.
