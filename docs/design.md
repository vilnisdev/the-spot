# The Spot — Design Document
**Chosen prototype:** Editorial Field Journal  
**Source:** `prototypes/editorial-field-journal/index.html`

---

## 1. Design Direction

**Name:** Editorial Field Journal  
**Tagline:** Print culture meets trail guide — hierarchy as spectacle, the scrapbook concept materialized.  
**The unforgettable thing:** Every pixel feels like it was typeset for a printed field guide. Serif-only typography, ink-on-paper palette, ornamental rules, and a modal that reads like a magazine caption block.  
**Anti-vibe-coding commitment:** No sans-serif fonts, no glassmorphism, no gradient buttons, no centered hero, no card grid. Every design choice ties back to the printed-page metaphor.

---

## 2. Color Tokens

### Light Mode (default)

| Token | Hex | Semantic Role |
|---|---|---|
| `--paper` | `#FAF8F3` | Primary surface (body background, overlays) |
| `--ink` | `#2C2416` | Primary text, icons |
| `--ink-faint` | `#9A8C78` | Secondary text, placeholders, faint labels |
| `--sepia` | `#8B7355` | Accent text (eyebrows, captions, ornaments) |
| `--tan` | `#C4A882` | Borders on tags, scrollbar thumb |
| `--tan-light` | `#E8DECE` | Muted fill (image placeholder background) |
| `--rule` | `#D4C8B4` | Divider lines, borders, separators |
| `--panel-bg` | `#F4F0E8` | Side panel background (slightly darker than paper) |
| `--modal-bg` | `#FEFCF8` | Modal background (slightly lighter/cleaner than paper) |
| `--accent` | `#7A5C38` | Primary interactive accent (hover states, author names, active pin) |

### Dark Mode (`[data-theme="dark"]`)

| Token | Hex | Semantic Role |
|---|---|---|
| `--paper` | `#1A1610` | Primary surface |
| `--ink` | `#E8E0D0` | Primary text |
| `--ink-faint` | `#7A7060` | Secondary text |
| `--sepia` | `#A09070` | Accent text |
| `--tan` | `#6A5840` | Borders |
| `--tan-light` | `#2E2820` | Muted fill |
| `--rule` | `#3A3028` | Dividers |
| `--panel-bg` | `#211E18` | Side panel |
| `--modal-bg` | `#1E1B14` | Modal |
| `--accent` | `#C4A882` | Interactive accent (lighter in dark mode) |

### Theme Switching
- Mechanism: `data-theme="light|dark"` attribute on `<html>`
- Transition: `background 500ms ease, color 500ms ease` on `html, body`
- Map tiles also swap on theme change (see Map component)

---

## 3. Typography

### Font Families

| Variable | Value | Usage |
|---|---|---|
| `--font-serif` | `'Playfair Display', Georgia, serif` | App name, modal title, zoom controls |
| `--font-body` | `'Source Serif 4', Georgia, serif` | All body text, UI labels, nav, metadata, comments |

**Rule:** No sans-serif fonts anywhere in the UI. Both families load from Google Fonts.

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap" rel="stylesheet" />
```

### Type Scale

| Element | Font | Size | Weight | Style | Letter-spacing | Notes |
|---|---|---|---|---|---|---|
| App name | `--font-serif` | `1.75rem` | `700` | normal | `-0.01em` | Fixed overlay top-left |
| App name subtitle | `--font-body` | `0.62rem` | `300` | italic | `0.22em` | Uppercase, color `--sepia` |
| Panel title | `--font-serif` | `1.45rem` | `700` | normal | — | Inside side panel header |
| Panel edition label | `--font-body` | `0.60rem` | `300` | italic | `0.25em` | Uppercase |
| Nav links | `--font-body` | `0.82rem` | `300` | normal | `0.18em` | Uppercase |
| Settings label | `--font-body` | `0.68rem` | `300` | italic | `0.20em` | Uppercase |
| Theme row label | `--font-body` | `0.78rem` | `300` | normal | `0.12em` | Uppercase |
| Search input | `--font-body` | `0.85rem` | `300` | italic | `0.06em` | |
| Modal eyebrow (date) | `--font-body` | `0.60rem` | `300` | italic | `0.22em` | Uppercase, color `--sepia` |
| Modal title | `--font-serif` | `1.65rem` | `700` | normal | — | Line-height `1.15` |
| Modal byline | `--font-body` | `0.72rem` | `300` | normal | `0.08em` | Author name in `--accent` |
| Modal description | `--font-body` | `0.82rem` | `300` | italic | — | Line-height `1.75`, wrapped in `"` quotes via CSS |
| Modal tags | `--font-body` | `0.60rem` | `300` | normal | `0.18em` | Uppercase |
| Modal coords | `--font-body` | `0.62rem` | `300` | normal | `0.12em` | Center-aligned |
| Comment author | `--font-body` | `0.68rem` | `600` | normal | `0.06em` | Color `--accent` |
| Comment text | `--font-body` | `0.78rem` | `300` | normal | — | Line-height `1.6` |
| Footer | `--font-body` | `0.62rem` | `300` | italic | `0.06em` | |
| Attribution | `--font-body` | `0.65rem` | — | — | — | Leaflet attribution override |

### Typography Principles
- Small caps / uppercase labels always paired with high letter-spacing (`0.18em`+)
- Italic used for: subtitles, captions, eyebrows, descriptions, placeholders — signals secondary/context information
- Body weight `300` (light) is the default — not `400`. Heavier weights only for titles and author names.
- Quoted descriptions use CSS `quotes: '\201C' '\201D'` with `::before`/`::after` — no hardcoded quote characters in markup.

---

## 4. Layout

### Primary Structure (z-index stack)

| Layer | Element | z-index | Position |
|---|---|---|---|
| 0 | `#map` | `0` | `fixed, inset: 0` — full viewport |
| 1 | `#app-name` | `100` | `fixed, top: 20px, left: 64px` |
| 2 | `#search-wrap` | `100` | `fixed, bottom: 28px, centered` |
| 3 | `#menu-toggle` | `200` | `fixed, top: 18px, left: 18px` |
| 4 | `#side-panel` | `150` | `fixed, top: 0, left: 0, h: 100%` |
| 5 | `#spot-modal` | `300` | `fixed, bottom: 0, left: 0, right: 0` |

**Note:** Side panel (`150`) sits below modal (`300`). Map click closes both panel and modal.

### Key Measurements

| Element | Value |
|---|---|
| Side panel width | `300px` (full-width on mobile) |
| Modal max-height | `72vh` |
| Modal image column width | `240px` (collapses to full-width on mobile) |
| Search bar max-width | `min(480px, calc(100vw - 48px))` |
| Hamburger button | `34px × 34px`, padding `6px` |
| Hamburger middle bar | `70%` width (asymmetric — print-culture detail) |

### Responsive Breakpoint

Single breakpoint at `580px`:
- `modal-inner` grid → `grid-template-columns: 1fr` (stacked)
- Image column border-right → none; border-bottom added
- `modal-img-frame` height → `160px` fixed
- `#side-panel` width → `100%`
- `#app-name` → `display: none`

---

## 5. Components

### Map

- **Library:** Leaflet `1.9.4` via `https://unpkg.com/leaflet@1.9.4/`
- **Initial center:** `[40.5, -111.5]` (Utah/Western US), zoom `6`
- **Light tiles:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Dark tiles:** `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png`
- **Zoom controls:** styled to match design — serif font, paper background, `--rule` border, no box-shadow
- **Attribution:** Source Serif 4, `0.65rem`, color `--ink-faint`, paper background at 80% opacity, no border-radius

**Custom pin icon:**
```js
// SVG teardrop path, sepia fill (inactive) or accent fill (active)
// White center dot at cx=8, cy=8, r=2.8
// iconSize: [16, 24], iconAnchor: [8, 24]
L.divIcon({ html: svgString, className: '', iconSize: [16, 24], iconAnchor: [8, 24] })
```

**Pin states:**
- Default: `--sepia` fill, `0.88` opacity
- Active (clicked): `--accent` fill
- Reset to default when modal closes or map clicked

### Side Panel

**Structure:**
```
nav#side-panel
  .panel-header         ← app name + edition label
  .panel-rule           ← SVG ornamental diamond divider
  .panel-nav            ← nav links (Profile, My Spots, Explore, Networks, Settings)
  #settings-pane        ← hidden until Settings clicked
  .panel-rule           ← second ornamental divider
  .panel-footer         ← italic tagline
```

**States:**
- Closed: `transform: translateX(-100%)`
- Open: `transform: translateX(0)`, class `open` added
- Transition: `600ms cubic-bezier(0.4, 0, 0.2, 1)`

**Ornamental rule SVG** (reused twice):
```svg
<svg width="14" height="10" viewBox="0 0 14 10">
  <path d="M7 1 C5 3, 2 3, 1 5 C2 7, 5 7, 7 9 C9 7, 12 7, 13 5 C12 3, 9 3, 7 1Z"
        fill="none" stroke="currentColor" stroke-width="0.75"/>
</svg>
```

**Nav link hover:** color → `--accent`, background → `--tan` at 8% opacity

**Settings pane:** toggled via class `visible` (`display: none` → `display: block`). Contains light/dark toggle only.

**Close triggers:** hamburger click (toggle), map click (force close)

### Search Bar

- Position: `fixed, bottom: 28px`, horizontally centered
- Width: `min(480px, calc(100vw - 48px))`
- Style: underline-only (`border-bottom: 1px solid --ink-faint`), no background, no border-radius
- Focus state: border-color → `--accent`, transition `700ms`
- Icon: 14×14 SVG magnifier, color `--ink-faint`
- Input: italic, weight 300, transparent background
- Placeholder: color `--ink-faint`

### Spot Modal

**Trigger:** click on map pin  
**Open state:** `transform: translateY(0)`, class `open`  
**Closed state:** `transform: translateY(100%)`  
**Transition:** `750ms cubic-bezier(0.4, 0, 0.2, 1)`  
**Close triggers:** close button click, map click

**Top ornamental bar:** centered SVG with horizontal rules flanking a leaf/diamond motif. Close `×` button positioned absolutely to right.

**Layout (desktop):** two-column grid — `240px image col | 1fr meta col`, separated by `1px --rule` border

**Image column:**
- `aspect-ratio: 3/4` image frame with sepia corner tick marks (CSS `::before`/`::after` borders)
- Placeholder: centered SVG image icon + italic "No photograph" label
- Coordinates displayed below in small monospaced-style body text

**Metadata column sections (top to bottom):**
1. Eyebrow (date, italic uppercase)
2. Title (Playfair Display 700, 1.65rem)
3. Byline (author name in `--accent`)
4. Ornamental divider (CSS flex with `::before`/`::after` lines + `✦` glyph)
5. Description (italic, CSS quotes, line-height 1.75)
6. Tags (uppercase bordered pills, no border-radius, `1px solid --tan`)
7. Comments section label
8. Comment list (author + body, `--rule` bottom border per comment)

**Scrollbar styling:** 3px width, transparent track, `--tan` thumb

### Theme Toggle

- Element: `<input type="checkbox">` inside `.toggle-wrap`
- Track: pill shape (`border-radius: 22px`), default color `--rule`, checked color `--accent`
- Knob: white circle, slides via `transform: translateX(18px)` when checked
- Transition: `400ms` on both track color and knob position
- On change: swaps Leaflet tile layer + sets `data-theme` on `<html>`

---

## 6. Motion & Transitions

| Element | Property | Duration | Easing | Trigger |
|---|---|---|---|---|
| `html, body` | `background`, `color` | `500ms` | `ease` | Theme toggle |
| `#side-panel` | `transform` | `600ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Menu open/close |
| `#spot-modal` | `transform` | `750ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Pin click / close |
| `#menu-toggle` | `opacity` | `900ms` | `ease` | Hover |
| `.panel-nav a` | `color`, `background` | `300ms` | — | Hover |
| `#search-wrap label` | `border-color` | `700ms` | — | Focus |
| `#close-modal` | `opacity` | `400ms` | — | Hover |
| `.toggle-track` | `background` | `400ms` | — | Checkbox change |
| `.toggle-track::after` | `transform` | `400ms` | — | Checkbox change |
| `.leaflet-control-zoom a` | `background`, `color` | (default) | — | Hover |

**Motion principles:**
- Slow, deliberate transitions (750–900ms for primary panels) — not snappy
- Standard cubic-bezier `(0.4, 0, 0.2, 1)` for spatial transitions (modal, panel)
- No animations on scroll, no staggered entrance animations, no bounce physics

---

## 7. Responsive Behavior

| Breakpoint | Changes |
|---|---|
| `> 580px` | Two-column modal grid (`240px` image + `1fr` meta), side panel `300px`, app name visible |
| `≤ 580px` | Single-column modal (image stacked above meta), image frame `160px` fixed height, side panel full-width, app name hidden |

---

## 8. Anti-Patterns Avoided

This design explicitly does not use:

| Pattern | What's used instead |
|---|---|
| Sans-serif fonts (Inter, Roboto, etc.) | Playfair Display + Source Serif 4 exclusively |
| Glassmorphism / frosted glass | Solid `--panel-bg` / `--modal-bg` with `--rule` borders |
| Neomorphism | Flat inked surfaces, rule lines as separators |
| Standard card shadow (`box-shadow: 0 4px 6px rgba(...)`) | No box-shadows anywhere |
| Gradient buttons | No gradient on any interactive element |
| Centered hero + CTA layout | Map-first full-viewport layout |
| Rounded pill inputs | Underline-only search input |
| Purple/blue gradient palette | Warm sepia/ink/paper palette |
| Generic card grid | No card grid — modal is the content surface |
| Fade-in-on-scroll animations | No scroll-triggered animations |
| Navbar (logo left, links right) | Hamburger only — no persistent navbar |

---

## 9. Implementation Notes

> These notes describe the **prototype** (`prototypes/editorial-field-journal/index.html`) specifically. The production app uses React-Leaflet (npm), Next.js, and Supabase — see `docs/prd-v1.md` for the full production stack. Design tokens, typography, and component patterns in sections 2–8 apply to both.

### CDN Dependencies (prototype only)

| Library | Version | URL |
|---|---|---|
| Leaflet CSS | `1.9.4` | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| Leaflet JS | `1.9.4` | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |
| Google Fonts | — | `Playfair+Display` + `Source+Serif+4` via fonts.googleapis.com |

### Map Tile Providers

| Mode | Provider | URL pattern |
|---|---|---|
| Light | OpenStreetMap | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| Dark | Stadia Alidade Smooth Dark | `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png` |

Stadia Maps requires a free API key for production use at volume.

### CSS Feature Notes

- `color-mix(in srgb, var(--tan) 8%, transparent)` — used for nav hover background. Requires Chrome 111+, Firefox 113+, Safari 16.2+.
- `inset: 0` shorthand — same support level as `color-mix`.
- SVG ornamental elements are inline — no external SVG files needed.

### Known Quirks

- Map click handler closes both side panel and modal simultaneously — intentional.
- `#app-name` uses `pointer-events: none` — cannot be interacted with (display only).
- Leaflet attribution and zoom styles are overridden with `!important` to match design tokens — fragile if Leaflet CSS load order changes.
- Settings pane toggled via `display: none / block` — no transition on open/close (intentional: appears instantly as a sub-section reveal).
