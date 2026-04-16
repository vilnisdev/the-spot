# The Spot — Design Document

**Design direction:** Editorial Field Journal — print culture meets trail guide.
**Stack:** Next.js 16 · React 19 · React-Leaflet · Supabase · CSS Modules

Paired with `docs/architecture.md` (system) and `docs/UBIQUITOUS_LANGUAGE.md` (terms). This doc is the visual + interaction source of truth for `dev`.

---

## 1. Design Philosophy

Serif-only typography, ink-on-paper palette, and deliberate motion. Every surface feels typeset for a printed field guide.

**Hard rules:**
- No sans-serif fonts anywhere
- No box-shadows on surfaces (one exception: `.the-spot-tooltip` has a faint 2px shadow for map-pin hover readability)
- No gradient buttons or backgrounds
- No glassmorphism
- `3px` border-radius permitted on small interactive controls (buttons, pills, tags, inputs) — softens without rounding
- Larger surfaces (modals, panels, forms, upload zones) use sharp (0px) corners

---

## 2. Color Tokens

Defined in `src/app/globals.css` as CSS custom properties. Values duplicated across three blocks (`:root`, `@media (prefers-color-scheme: dark) :root`, `:root[data-theme="light"]`, `:root[data-theme="dark"]`) — update all when adding a var.

### Light Mode

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
| `--panel-bg` | `#F4F0E8` | Side panel background |
| `--modal-bg` | `#FEFCF8` | Modal/form background |

### Dark Mode

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

### Theme mechanism

**Resolution is server-side.** `src/app/layout.tsx` reads the `ts_theme` cookie and sets `<html data-theme="light|dark">`. `@media (prefers-color-scheme: dark)` in `globals.css` serves as the **system** fallback when no explicit preference is set.

| Cookie value | Applied attribute | Notes |
|---|---|---|
| `light` | `data-theme="light"` | Explicit override beats media query |
| `dark` | `data-theme="dark"` | Explicit override beats media query |
| `system` | (no attribute) | Media query decides |
| missing | `data-theme="dark"` | Default-dark since issue #48 |

Writing a new preference goes through `updateThemePreferenceAction` (sets cookie + `profiles.theme_preference`). Client hook `useTheme()` applies changes live (`applyTheme()` in `src/lib/theme.ts`). No FOUC: the server already emitted the right attribute.

Map tiles swap on dark mode: Stadia Alidade Smooth Dark (dark) / OpenStreetMap (light).

---

## 3. Typography

### Font Families

| Variable | Value | Usage |
|---|---|---|
| `--font-serif` | `'Playfair Display', Georgia, serif` | Panel title, Spot title, Spot Card title |
| `--font-body` | `'Source Serif 4', Georgia, serif` | Body text, labels, inputs, buttons, metadata |

Loaded from Google Fonts at the top of `globals.css`:

```
Playfair Display: ital,wght 0,400; 0,600; 0,700; 1,400; 1,600
Source Serif 4:   ital,wght 0,300; 0,400; 0,600; 1,300; 1,400
```

**Default body weight:** 300 (light). Heavier weights only for titles and strong labels.

### UI size scale

Root font-size scales with `html[data-size]` so every `rem`-based size follows automatically. Persisted via `ts_ui_size` cookie + `profiles.ui_size`. Controls in Settings.

| `data-size` | Root font-size | Relative |
|---|---|---|
| (default / `regular`) | `16px` | 100% |
| `large` | `18.4px` | 115% |
| `xlarge` | `20.8px` | 130% |

### Type Scale (representative, live app)

| Element | Font | Size | Weight | Style | Letter-spacing |
|---|---|---|---|---|---|
| Panel title ("The Spot") | `--font-serif` | `1.25rem` | `600` | normal | `0.02em` |
| Section label (e.g. "NETWORKS") | `--font-body` | `0.7rem` | `600` | normal | `0.12em` uppercase |
| Network filter button | `--font-body` | `0.875rem` | `300` | normal | — |
| Spot title (Card / Immersive) | `--font-serif` | `1.5rem` | `700` | normal | `0.01em` |
| Spot creation description | `--font-body` | `0.9rem` | `300` | italic | — |
| Network pill toggle | `--font-body` | `0.72rem` | `400` | normal | `0.06em` |
| Autofill value | `--font-body` | `0.82rem` | `300` | italic | — |
| Add Spot button | `--font-body` | `0.72rem` | `300` | uppercase | `0.18em` |
| Drop mode banner | `--font-body` | `0.72rem` | `300` | italic | `0.03em` |
| Form action buttons | `--font-body` | `0.78rem` | `600` | uppercase | `0.14em` |
| Upload placeholder label | `--font-body` | `0.78rem` | `300` | italic | `0.04em` |
| Upload hint | `--font-body` | `0.65rem` | `300` | uppercase | `0.06em` |
| Field error message | `--font-body` | `0.72rem` | `300` | italic | — |
| Pin hover tooltip title | `--font-serif` | `0.8rem` | `400` | normal | — |

### Typography Principles

- Uppercase labels always paired with `letter-spacing: 0.1em+`
- Italic = secondary / contextual (descriptions, captions, placeholders, autofill values)
- Weight 300 is default; 600+ only for titles, panel labels, and primary actions

---

## 4. Layout & Z-Index Stack

### Map page structure (`/`)

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
              ├── MapSearchBar (position: absolute, top)
              ├── SpotCard (position: absolute, above search)
              ├── .dropBanner (z-index: 1001) — drop mode only
              └── .addSpotBtn (bottom: 28px, right: 24px, z-index: 1001)

SpotCreationForm / SpotEditForm (.overlay, position: fixed, bottom: 0, z-index: 300)
SpotImmersive (position: fixed, inset: 0, z-index: 400)
ExploreExitChip (position: fixed, top, z-index: 1002) — explore mode only
```

### Non-map pages

Profile / Networks / Settings share `PageNav` — a serif side/top nav that mirrors the side panel's visual weight. Pages are Server Components with Client form children.

### Z-index tiers

| Tier | Value | Used for |
|---|---|---|
| Map base | `1` | `.mapWrap` — **must** have an explicit `z-index` to contain Leaflet panes |
| Leaflet internals | `200–1000` | Tile/overlay/marker/popup/control panes |
| Side panel | `1000` | Always-visible desktop; slide-in mobile |
| Map overlays | `1001` | `.addSpotBtn`, `.dropBanner`, `.menuBtn`, pin hover tooltip |
| Explore exit chip | `1002` | Above everything on the map |
| Creation form | `300` | `position: fixed` — outside Leaflet stacking context |
| Immersive view | `400` | Full-viewport, overlays map + chrome below explore chip |

> **Critical:** `.mapWrap` must establish its own stacking context (`z-index: 1`). Without it, Leaflet panes escape and cover sibling UI regardless of their z-index.

### Key Measurements

| Element | Value |
|---|---|
| Side panel width | `300px` (full-width on mobile) |
| Creation/Edit form max-height | `72vh` |
| Form media column width | `240px` (stacks on mobile) |
| Add Spot button position | `bottom: 28px, right: 24px` |
| Hamburger button | `40px × 40px`, `top: 12px, left: 12px` |
| Panel header padding | `24px 20px 12px` |
| Pin hover tooltip image | `120 × 90px` |

### Responsive breakpoint: `580px`

| Element | Desktop | Mobile (≤580px) |
|---|---|---|
| `.panel` | `position: relative; width: 300px` | `position: absolute; width: 100%; transform: translateX(-100%)` |
| `.menuBtn` | `display: none` | `display: flex` |
| `.inner` (creation form) | `grid-template-columns: 240px 1fr` | `grid-template-columns: 1fr` |
| Upload zone | `aspect-ratio: 3/4` | `aspect-ratio: 16/9` |

---

## 5. Components

### Map

#### `MapView.tsx`
- Library: `react-leaflet` + `leaflet`
- Light tiles: OpenStreetMap `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Dark tiles: Stadia Alidade Smooth Dark
- `zoomControl={false}`, `attributionControl={false}`
- Initial zoom: `10` if any spots, else `3`
- Initial center: centroid of visible spots, else `[51.505, -0.09]`

Custom pin icon (SVG `divIcon`):

| State | Fill | Stroke | Center dot |
|---|---|---|---|
| Saved (default) | `--sepia` | none | white, 60% opacity |
| Saved (hover/active) | `--accent` | none | white, 60% opacity |
| Provisional (drop) | none | `--tan`, dashed `4 3` | none |

```js
L.divIcon({ html: svgString, className: 'the-spot-pin', iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -34] })
```

#### Pin hover tooltip (`.the-spot-tooltip`, global in `globals.css`)
- Appears on pin mouseover
- If spot has a hero image: shows `120 × 90` cover image above the title
- If no image: shows title only
- Border `1px solid var(--rule)`, `--modal-bg` background, `3px` radius
- Exception to "no shadows" rule: `box-shadow: 0 2px 8px rgba(44,36,22,0.12)` for legibility over map

#### `MapSearchBar.tsx`
- Position: top of `.mapWrap`
- Calls `searchSpotsAction` (debounced) → `search_spots` RPC
- Results dropdown: each hit, click = `flyToAbovePin` + open SpotCard
- Hidden in Explore mode

#### `NetworkFilter.tsx`
- "All Networks" button always first
- Active: `background: var(--tan-light); border: 1px solid var(--tan); color: var(--accent); font-weight: 600`
- Hover: `background: var(--tan-light)`
- `border-radius: 3px`

#### `SpotCard.tsx`
- Compact preview; opens when a pin is clicked
- `position: absolute`, sits above the search bar
- Shows hero image, title (Playfair `1.5rem / 700`), author, month+year
- Actions: close (×) + expand (opens `SpotImmersive`)
- Two-stage Spot UI: Card = glance, Immersive = full reading/editing surface

#### `SpotImmersive.tsx`
- Full-viewport, `position: fixed; inset: 0; z-index: 400`
- Media-first: hero + carousel + caption
- Author-only inline editing mode (delegates to logic mirroring `SpotEditForm`)
- Hides map chrome while open; back button returns to Card

#### `SpotModal.tsx`
- Legacy wrapper still present in code. Prefer `SpotCard` + `SpotImmersive` for new work. Will be removed when callers migrate.

#### `SpotCreationForm.tsx`
- `position: fixed; bottom: 0; left/right: 0; max-height: 72vh; z-index: 300`
- Slide-up: `translateY(100%) → 0`, `750ms cubic-bezier(0.4, 0, 0.2, 1)`
- `background: var(--modal-bg); border-top: 1px solid var(--rule)`
- Sharp corners on surface; `3px` radius on pills/inputs inside
- Right-column field order: Title · Description (+ inline `#hashtag`) · Visible-to pill row · Date/Author autofill · Discard banner · Server error · Save + Cancel
- Left column: Upload zone (`3/4` aspect on desktop, `16/9` mobile), dashed `--tan` border, camera SVG + italic placeholder

Network pills:
- Unselected: `border: 1px solid var(--tan); color: var(--sepia); background: transparent`
- Selected: `background: var(--ink); color: var(--paper); border-color: var(--ink)`
- No border-radius

Action buttons:
- Primary (ink): `background: var(--ink); color: var(--paper); border: 1px solid var(--ink)`
- Ghost: `background: transparent; color: var(--ink); border: 1px solid var(--rule)`

#### `SpotEditForm.tsx`
- Author-only edit of an existing Spot; same shape as creation form but no drop-pin stage; add/remove media, re-pick networks, edit title/description/date.

#### Drop mode banner (`.dropBanner`)
- `position: absolute; top: 12px; left: 50%; translateX(-50%)`
- `background: var(--ink); color: var(--paper)`; italic `0.72rem`
- Visible only while drop mode active; `×` exits

#### Add Spot button (`.addSpotBtn`)
- `position: absolute; bottom: 28px; right: 24px`
- Default: `background: var(--panel-bg); border: 1px solid var(--rule)`
- Active (drop mode): `background: var(--ink); color: var(--paper)`
- Uppercase Source Serif 4 `0.72rem / 300`, letter-spacing `0.18em`. No border-radius.

#### Hamburger (`.menuBtn`)
- Mobile only (`≤580px`)
- `40 × 40px`, `--panel-bg` background, `1px solid var(--rule)`, `3px` radius
- `z-index: 1001` sits above the panel so still tappable while panel open

#### Explore mode (`useExploreMode.ts` + `ExploreExitChip.tsx` + `exploreEsc.ts`)
- Distraction-free map viewing. Hides panel trigger, MapSearchBar, Add Spot button.
- Pins remain clickable.
- Only chrome visible: an "esc" exit chip (`position: fixed; z-index: 1002`), minimal ink-on-paper pill.
- Ephemeral: `esc` key or chip click exits. Lost on reload. Not persisted.
- Distinct from **Drop mode** (placement UX) and **Immersive** (single-Spot view).

### Shared

#### `PageNav.tsx` (`src/components/shared/`)
- Nav chrome for non-map pages (Profile, Networks, Settings)
- Matches panel visual weight: `--panel-bg`, `1px solid var(--rule)` separator, serif title
- Active link: `color: var(--accent)`, medium weight

---

## 6. Motion & Transitions

| Element | Property | Duration | Easing | Trigger |
|---|---|---|---|---|
| `.panel` (mobile) | `transform` | `600ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Hamburger click |
| Creation/Edit form | `transform` slide-up | `750ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Drop pin / edit tap |
| Spot Card in/out | `opacity + transform` | `250ms` | ease-out | Pin click / close |
| Immersive in/out | `opacity` fade | `250ms` | ease-out | Card expand / back |
| Pin fill | `fill` | `200ms` | — | Active/inactive |
| Add Spot button | `background, color, border-color` | `150ms` | — | Drop mode toggle |
| Network pill | `background, color, border-color` | `150ms` | — | Select |
| Filter button | `background, color, border-color` | `200ms` | — | Click |

**Motion principles:**
- Slow, deliberate transitions (600–750ms for primary surfaces) — editorial, not snappy
- Standard material easing `cubic-bezier(0.4, 0, 0.2, 1)` for spatial transitions
- No scroll-triggered animations, no bounce physics, no staggered entrance

---

## 7. Border-Radius Convention

**Global token:** `--radius: 3px` (defined in `globals.css :root`).

A global rule applies `border-radius: var(--radius)` to all `button`, `input`, `textarea`, `select`. No per-component overrides needed for interactive controls.

| Surface | Radius | How applied |
|---|---|---|
| Buttons, inputs, textareas, selects | `3px` | Global rule via `--radius` |
| Full-surface containers (panels, forms, overlays, upload zone, SpotCard, Immersive) | `0px` | No rule applied |
| Theme toggle track | `22px` (pill) | Explicit — affordance exception |
| Pin hover tooltip | `3px` | Global `.the-spot-tooltip` class |

---

## 8. Anti-Patterns

| Avoided | Used instead |
|---|---|
| Sans-serif fonts | Playfair Display + Source Serif 4 only |
| Box-shadows on surfaces | `1px solid var(--rule)` borders as elevation signal |
| Glassmorphism | Solid `--panel-bg` / `--modal-bg` |
| Gradient buttons | Flat ink fill or ghost border |
| Rounded pill buttons | Sharp corners on primary actions |
| Centered hero layout | Map-first full-viewport |
| Persistent navbar | Hamburger-only on mobile; PageNav on non-map pages |
| Leaflet zoom/attribution UI | Both removed |
| JS-only theme with FOUC | SSR via `data-theme` cookie; `prefers-color-scheme` fallback for `system` |

---

## 9. Non-map page conventions

Auth, Networks, Profile, Settings all share:

- `PageNav` on the left (stacks above on mobile)
- Page title in Playfair `1.5rem / 700`
- Form inputs inherit the global `3px` radius; labels uppercase `0.7rem / 600 / 0.12em`
- Primary action button = ink fill; secondary = ghost; destructive = ink with `--accent` border
- `/settings` hosts: username edit, theme toggle (`light` / `dark` / `system`), UI size toggle (`regular` / `large` / `xlarge`), link to `/settings/password`

See `docs/architecture.md` §4 for action signatures wired to these pages.
