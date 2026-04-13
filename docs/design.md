# The Spot — Design Document

**Design direction:** Editorial Field Journal — print culture meets trail guide.
**Stack:** Next.js · React-Leaflet · Supabase · CSS Modules

---

## 1. Design Philosophy

Serif-only typography, ink-on-paper palette, and deliberate motion. Every surface feels typeset for a printed field guide.

**Hard rules:**
- No sans-serif fonts anywhere
- No box-shadows
- No gradient buttons or backgrounds
- No glassmorphism
- 3px border-radius permitted on small interactive controls (buttons, pills, tags) — softens without rounding
- Larger surfaces (modals, panels, forms, upload zones) use sharp (0px) corners

---

## 2. Color Tokens

Defined in `src/app/globals.css` as CSS custom properties.

### Light Mode (default)

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#FAF8F3` | Primary surface — body, overlays |
| `--ink` | `#2C2416` | Primary text, icons, filled buttons |
| `--ink-faint` | `#9A8C78` | Secondary text, placeholders, labels |
| `--sepia` | `#8B7355` | Accent text — eyebrows, captions, autofill values |
| `--accent` | `#7A5C38` | Interactive accent — focus states, active pins, selected |
| `--tan` | `#C4A882` | Borders on tags/pills, dashed upload zone border |
| `--tan-light` | `#E8DECE` | Muted fill — upload zone bg, drag hover, filter active bg |
| `--rule` | `#D4C8B4` | Divider lines, default borders, separators |
| `--panel-bg` | `#F4F0E8` | Side panel background (slightly darker than paper) |
| `--modal-bg` | `#FEFCF8` | Modal/form background (slightly lighter/cleaner than paper) |

### Dark Mode (`@media (prefers-color-scheme: dark)`)

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#1A1610` | Primary surface |
| `--ink` | `#E8E0D0` | Primary text |
| `--ink-faint` | `#7A7060` | Secondary text |
| `--sepia` | `#A09070` | Accent text |
| `--accent` | `#C4A882` | Interactive accent (lighter in dark mode) |
| `--tan` | `#6A5840` | Tag/pill borders |
| `--tan-light` | `#2E2820` | Muted fill |
| `--rule` | `#3A3028` | Dividers |
| `--panel-bg` | `#211E18` | Side panel |
| `--modal-bg` | `#1E1B14` | Modal/form |

**Mechanism:** `@media (prefers-color-scheme: dark)` — no JS, no `data-theme` attribute.  
Map tiles also swap on dark mode (see Map section).

---

## 3. Typography

### Font Families

| Variable | Value | Usage |
|---|---|---|
| `--font-serif` | `'Playfair Display', Georgia, serif` | Panel title, spot title, spot creation title input |
| `--font-body` | `'Source Serif 4', Georgia, serif` | All body text, labels, inputs, buttons, metadata |

Loaded from Google Fonts:
```
Playfair Display: ital,wght 0,400; 0,600; 0,700; 1,400; 1,600
Source Serif 4: ital,wght 0,300; 0,400; 0,600; 1,300; 1,400
```

**Default body weight:** 300 (light). Heavier weights only for titles and strong labels.

### Type Scale (live app)

| Element | Font | Size | Weight | Style | Letter-spacing |
|---|---|---|---|---|---|
| Panel title ("The Spot") | `--font-serif` | `1.25rem` | `600` | normal | `0.02em` |
| Section label (e.g. "NETWORKS") | `--font-body` | `0.7rem` | `600` | normal | `0.12em` uppercase |
| Network filter button | `--font-body` | `0.875rem` | `300` | normal | — |
| Spot creation title input | `--font-serif` | `1.5rem` | `700` | normal | `0.01em` |
| Spot creation description | `--font-body` | `0.9rem` | `300` | italic | — |
| Network pill toggle | `--font-body` | `0.72rem` | `400` | normal | `0.06em` |
| Networks row label ("Visible to") | `--font-body` | `0.7rem` | `600` | normal | `0.12em` uppercase |
| Autofill label (Date/Author) | `--font-body` | `0.68rem` | `600` | normal | `0.1em` uppercase |
| Autofill value | `--font-body` | `0.82rem` | `300` | italic | — |
| Coords below upload zone | `--font-body` | `0.68rem` | `300` | italic | `0.03em` |
| Add Spot button | `--font-body` | `0.72rem` | `300` | normal | `0.18em` uppercase |
| Drop mode banner | `--font-body` | `0.72rem` | `300` | italic | `0.03em` |
| Form action buttons | `--font-body` | `0.78rem` | `600` | normal | `0.14em` uppercase |
| Discard banner | `--font-body` | `0.8rem` | `300` | italic | — |
| Upload placeholder label | `--font-body` | `0.78rem` | `300` | italic | `0.04em` |
| Upload hint | `--font-body` | `0.65rem` | `300` | normal | `0.06em` uppercase |
| Field error message | `--font-body` | `0.72rem` | `300` | italic | — |

### Typography Principles

- Uppercase labels always paired with `letter-spacing: 0.1em+`
- Italic signals secondary / contextual information (descriptions, captions, placeholders, autofill values)
- Weight 300 is the default; 600+ only for titles, panel labels, and primary actions

---

## 4. Layout & Z-Index Stack

### Page structure

```
body (flex column, height: 100%)
└── main (height: 100vh, overflow: hidden)
    └── .layout (flex row, position: relative, height: 100vh)
        ├── .panel (position: relative, z-index: 1000, width: 300px)
        │     ├── .panelHeader
        │     └── .panelSection → NetworkFilter
        ├── .menuBtn (position: absolute, top: 12px, left: 12px, z-index: 1001)
        │     — display: none on desktop; display: flex at ≤580px
        └── .mapWrap (flex: 1, position: relative, z-index: 1)
              ├── MapView (Leaflet, 100% × 100%)
              ├── .dropBanner (position: absolute, z-index: 1001) — drop mode only
              └── .addSpotBtn (position: absolute, bottom: 28px, right: 24px, z-index: 1001)

SpotCreationForm (.overlay, position: fixed, bottom: 0, z-index: 300)
```

### Z-index tiers

| Tier | Value | Used for |
|---|---|---|
| Map base | `1` | `.mapWrap` stacking context boundary — **must have z-index to contain Leaflet panes** |
| Leaflet internals | `200–1000` | Tile/overlay/marker/popup/control panes — contained within `.mapWrap` |
| Panel | `1000` | Side panel (desktop always visible; mobile slides in) |
| Map overlays | `1001` | `.addSpotBtn`, `.dropBanner`, `.menuBtn` — above panel and all Leaflet elements |
| Creation form | `300` | `position: fixed` — outside Leaflet stacking context entirely |

> **Critical:** `.mapWrap` must have an explicit `z-index` (currently `1`) to establish a stacking context. Without it, Leaflet's internal panes escape their container and cover sibling UI elements regardless of their z-index.

### Key Measurements

| Element | Value |
|---|---|
| Side panel width | `300px` (full-width on mobile) |
| Creation form max-height | `72vh` |
| Form media column width | `240px` (stacks on mobile) |
| Add Spot button position | `bottom: 28px, right: 24px` |
| Hamburger button | `40px × 40px`, `top: 12px, left: 12px` |
| Panel header padding | `24px 20px 12px` |

### Responsive Breakpoint: 580px

| Element | Desktop | Mobile (≤580px) |
|---|---|---|
| `.panel` | `position: relative; width: 300px` | `position: absolute; width: 100%; transform: translateX(-100%)` |
| `.menuBtn` | `display: none` | `display: flex` |
| `.inner` (creation form) | `grid-template-columns: 240px 1fr` | `grid-template-columns: 1fr` |
| Upload zone | `aspect-ratio: 3/4` | `aspect-ratio: 16/9` |

---

## 5. Components

### Map (`MapView.tsx`)

- **Library:** react-leaflet + leaflet (npm)
- **Light tiles:** OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- **Dark tiles:** Stadia Alidade Smooth Dark
- **Zoom controls:** `zoomControl={false}` — removed
- **Attribution:** `attributionControl={false}` — removed
- **Initial zoom:** `10` if spots exist, `3` otherwise
- **Initial center:** centroid of visible spots, or `[51.505, -0.09]` fallback

**Custom pin icon (SVG divIcon):**

| State | Fill | Stroke | Center dot |
|---|---|---|---|
| Saved (default) | `--sepia` | none | white, 60% opacity |
| Saved (active hover) | `--accent` | none | white, 60% opacity |
| Provisional (drop pin) | none | `--tan`, dashed `4 3` | none |

```js
L.divIcon({ html: svgString, className: '', iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -34] })
```

### Side Panel (`MapPage.tsx` + `map.module.css`)

- Desktop: always visible, `300px` wide, `border-right: 1px solid var(--rule)`
- Mobile: slides in from left, `600ms cubic-bezier(0.4, 0, 0.2, 1)`
- Contains: panel title + network filter section only (currently)

### Network Filter (`NetworkFilter.tsx`)

- "All Networks" button always first
- Active state: `background: var(--tan-light); border-color: var(--tan); color: var(--accent); font-weight: 600`
- Hover: `background: var(--tan-light); border-color: var(--rule)`
- `border-radius: 3px` — subtle rounding on small interactive controls

### Hamburger Button (`.menuBtn`)

- Mobile only (`≤580px`)
- `position: absolute; top: 12px; left: 12px; z-index: 1001`
- `40px × 40px`, `background: var(--panel-bg)`, `border: 1px solid var(--rule)`, `border-radius: 3px`
- Sits above panel (`z-index: 1000`) so it remains tappable even when panel is open

### Add Spot Button (`.addSpotBtn`)

- `position: absolute; bottom: 28px; right: 24px` inside `.mapWrap`
- Default: `background: var(--panel-bg); border: 1px solid var(--rule)`
- Active (drop mode): `background: var(--ink); color: var(--paper); border-color: var(--ink)`
- Source Serif 4, `0.72rem`, weight 300, uppercase, `letter-spacing: 0.18em`
- No border-radius — stamp aesthetic

### Drop Mode Banner (`.dropBanner`)

- `position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 1001`
- Ink-inverted: `background: var(--ink); color: var(--paper)`
- Source Serif 4 italic, `0.72rem`
- Visible only while drop mode is active; `×` button exits drop mode
- No border-radius

### Spot Creation Form (`SpotCreationForm.tsx` + `spotCreationForm.module.css`)

- `position: fixed; bottom: 0; left: 0; right: 0; max-height: 72vh; z-index: 300`
- Slides up: `translateY(100%) → translateY(0)`, `750ms cubic-bezier(0.4, 0, 0.2, 1)`
- `background: var(--modal-bg); border-top: 1px solid var(--rule)`
- Sharp corners on the form itself; `border-radius: 3px` on pill/tag elements inside

**Field order (right column):**
1. Title input — Playfair Display 700, `1.5rem`, `border-bottom` at rest, `--accent` on focus
2. Description textarea — italic Source Serif 4, auto-grow, `border-bottom`; supports `#hashtag` inline tagging
3. "Visible to" + network pills (inline row)
4. Date / Author autofill block (italic sepia values, editable on click)
5. Discard banner (dirty-cancel confirmation) — appears inline above actions
6. Server error (if any)
7. Save Spot (ink fill) + Cancel (ghost) buttons

**Network pills:**
- Unselected: `border: 1px solid var(--tan); color: var(--sepia); background: transparent`
- Selected: `background: var(--ink); color: var(--paper); border-color: var(--ink)`
- No border-radius — stamp aesthetic

**Upload zone (left column):**
- `aspect-ratio: 3/4` (16/9 on mobile)
- Corner tick marks (CSS `::before`/`::after`-style spans), dashed inner border `1px dashed var(--tan)`
- Empty: SVG camera icon + italic placeholder text
- Filled: thumbnail grid (3:4 images; audio as icon + filename stub)
- Sharp corners throughout

**Action buttons:**
- Primary: `background: var(--ink); color: var(--paper); border: 1px solid var(--ink)` — no border-radius
- Ghost: `background: transparent; color: var(--ink); border: 1px solid var(--rule)` — no border-radius

---

## 6. Motion & Transitions

| Element | Property | Duration | Easing | Trigger |
|---|---|---|---|---|
| `.panel` (mobile) | `transform` | `600ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Hamburger click |
| `.overlay` (creation form) | `transform` (slideUp) | `750ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Drop pin placed |
| Pin fill | `fill` | `200ms` | — | Active/inactive state change |
| Add Spot button | `background, color, border-color` | `150ms` | — | Drop mode toggle |
| Network pill | `background, color, border-color` | `150ms` | — | Toggle selection |
| Filter button | `background, color, border-color` | `200ms` | — | Network filter click |
| Autofill value | `border-color, color` | — | — | Focus (instant) |

**Motion principles:**
- Slow, deliberate transitions (600–750ms for primary surfaces) — editorial, not snappy
- Standard material easing `cubic-bezier(0.4, 0, 0.2, 1)` for spatial transitions (panels, forms)
- No scroll-triggered animations, no bounce physics, no staggered entrance

---

## 7. Border-Radius Convention

| Element type | Radius | Rationale |
|---|---|---|
| Full-surface containers (panels, forms, overlays, upload zone) | `0px` | Hard editorial corners |
| Small interactive controls (filter buttons, hamburger, discard/action sub-buttons) | `3px` | Subtle softening without rounding |
| Tag-style pills (network pills, future tag chips) | `0px` | Stamp/label aesthetic |
| Primary action buttons (Save Spot, Cancel) | `0px` | Stamp aesthetic |
| Add Spot button | `0px` | Stamp aesthetic |
| Theme toggle track only | `22px` (pill) | Toggle affordance exception |

---

## 8. Anti-Patterns

| Avoided | Used instead |
|---|---|
| Sans-serif fonts | Playfair Display + Source Serif 4 only |
| Box-shadows | `1px solid var(--rule)` borders as elevation signal |
| Glassmorphism | Solid `--panel-bg` / `--modal-bg` surfaces |
| Gradient buttons | Flat ink fill or ghost border only |
| Rounded pill buttons | Sharp corners (0px) on primary actions |
| Centered hero layout | Map-first full-viewport |
| Persistent navbar | Hamburger-only panel on mobile |
| Leaflet zoom/attribution UI | Both removed (`zoomControl={false}`, `attributionControl={false}`) |
| JS-based theme switching | `@media (prefers-color-scheme: dark)` only |
