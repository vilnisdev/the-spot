# CLAUDE.md — The Spot

Behavioral guidelines for this codebase. Read before writing any code.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- Before adding a component, explicitly state: is this a Server Component or Client Component, and why?
- Before touching a Supabase query, confirm: are you in a server or client context? Wrong client = broken RLS.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code. Three similar instances before abstracting.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- No state management libraries (Zustand, Redux, Context) — local `useState` + server props is the established pattern.
- No loading skeletons or suspense spinners in Server Components — data is pre-rendered.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style: CSS Module class names are `camelCase`, components are `PascalCase`.
- Don't touch CSS variables or theme tokens unless the task is about theming.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write a Vitest test for invalid inputs, then make it pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

---

## 5. Server / Client Boundary

This is Next.js App Router. The boundary matters.

| Context | Supabase client | Directive |
|---|---|---|
| Page, Layout, Server Component | `createSupabaseServerClient()` from `@/lib/supabase/server` | (none / async) |
| Server Action | `createSupabaseServerClient()` from `@/lib/supabase/server` | `'use server'` |
| Client Component | `createSupabaseBrowserClient()` from `@/lib/supabase/browser` | `'use client'` |

Rules:
- Never import `@/lib/supabase/server` in a `'use client'` file.
- Mutations go in Server Actions under `app/actions/` — not inside Client Components.
- Action results use discriminated unions: `{ data: T } | { error: string }`. Narrow with `'error' in result`.

## 6. Supabase & Data Rules

- **RLS is the access-control layer.** Don't replicate DB policy with client-side visibility checks.
- **Signed URLs for storage.** Always generate server-side, 1-hour expiry. Never expose raw storage paths to the client. Use `parseStoragePath()` from `app/actions/spots.ts`.
- **Prefer server-side data fetching.** Async Server Components > client-side fetch + loading state.
- **Schema changes require a migration** in `supabase/migrations/`. Never mutate schema manually in the dashboard for tracked changes.

## 7. Styling Rules

- **CSS Modules only.** No Tailwind, no inline styles, no additions to global classes.
- **Co-locate styles.** Each component gets its own `.module.css` in the same folder. Import as `import styles from './ComponentName.module.css'`.
- **CSS custom properties for all values.** Colors, fonts, spacing, and radius must reference variables:
  - Colors: `--ink`, `--paper`, `--accent`, `--tan`, `--rule`, `--panel-bg`, `--modal-bg`
  - Typography: `--font-serif` (Playfair Display), `--font-body` (Source Serif 4)
  - Shape: `--radius` (3px)
- **Dark mode via attribute.** `[data-theme="dark"]` overrides live in `globals.css`. Don't hardcode color values — use variables.

## 8. Domain Language

Use terms from `docs/UBIQUITOUS_LANGUAGE.md` exactly in code, comments, and copy.

Critical distinctions:

| Correct | Wrong | Why |
|---|---|---|
| **Spot** | location, place, post, POI | Spot is the domain entity |
| **Pin** | marker, dot, pushpin | Pin is the map representation of a Spot |
| **Network** | group, community, server, team | Network is the canonical trust boundary |
| **Member** | user (in Network context) | User = auth identity; Member = User within a Network |
| **Author** | creator, owner, poster | Author = Member who created the Spot |
| **Drop** | place, add, create (in map context) | Drop = the act of placing a Pin to start a Spot |
| **Explore mode** | fullscreen, focus mode, immersive | Explore = distraction-free viewing, hides chrome |
| **Invitation** | invite link, referral | Invitation is the canonical term |

**Spot ≠ Pin.** You drop a Pin to create a Spot. You click a Pin to open the Spot Modal. Never use them interchangeably.

## 9. Testing Rules

- **Framework: Vitest.** Not Jest — never use `jest.*` APIs.
- **Integration tests hit a real Supabase test project** (`.env.test`). Do not mock the database — mocks hide RLS failures.
- **Use seed helpers** from `tests/integration/helpers/seed.ts`:
  - `createUser()`, `signIn()`, `cleanupUsers()`
  - `seedNetwork()`, `seedMembership()`, `seedSpot()`, `seedInvitation()`
- **Tests run sequentially** (`concurrent: false`). Shared test DB — don't assume clean state unless you seeded it.
- **Always clean up** in `afterAll` — call `cleanupUsers()` or equivalent to avoid test pollution.
- Test timeout is 20s — suitable for real DB operations; don't lower it.
