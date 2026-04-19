# The Spot — Architecture

Living reference for how the app is put together. Paired with `docs/design.md` (visual system) and `docs/UBIQUITOUS_LANGUAGE.md` (domain terms). Source of truth is the `dev` branch; update this file when architecture shifts.

---

## 1. Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js App Router | `16.2.3` |
| UI | React + CSS Modules | `19.2.4` |
| Map | `leaflet` + `react-leaflet` | `1.9.4` / `5.0.0` |
| Data / Auth | Supabase (`@supabase/ssr` + `supabase-js`) | `0.10.2` / `2.103.0` |
| Tests | Vitest (integration against real test DB) | `4.1.4` |
| Language | TypeScript | `5.x` |

No Tailwind, no state library, no ORM. App-specific APIs live in Server Actions; DB-specific logic lives in Postgres RPCs.

> **Heads-up:** Next 16 has breaking changes vs training data. When writing code, consult `app/node_modules/next/dist/docs/` first. See `app/AGENTS.md`.

---

## 2. Directory map

```
the-spot/
├── app/
│   ├── src/
│   │   ├── app/                       # App Router pages + layouts + actions
│   │   │   ├── layout.tsx             # Root — reads theme/size cookies → data-theme/data-size
│   │   │   ├── page.tsx               # Map home (Server Component)
│   │   │   ├── globals.css            # CSS vars, theme, pin/tooltip classes
│   │   │   ├── actions/               # Server Actions (one file per feature)
│   │   │   ├── auth/confirm/          # Email confirm route handler
│   │   │   ├── login/, register/, forgot-password/, reset-password/
│   │   │   ├── invite/[token]/        # Invitation landing
│   │   │   ├── networks/              # Network list + detail + invite form
│   │   │   ├── profile/               # My Spots list
│   │   │   └── settings/              # Username, theme, UI size, password
│   │   ├── components/
│   │   │   ├── map/                   # Map surfaces: MapView, MapPage, NetworkFilter,
│   │   │   │                          # MapSearchBar, SpotCard, SpotImmersive,
│   │   │   │                          # SpotModal (legacy wrapper), SpotCreationForm,
│   │   │   │                          # SpotEditForm, ExploreExitChip + hooks/helpers
│   │   │   ├── profile/               # ProfilePage, SpotCard (profile variant)
│   │   │   ├── settings/              # SettingsPage
│   │   │   └── shared/                # PageNav
│   │   ├── hooks/                     # useTheme, useUiSize
│   │   ├── lib/
│   │   │   ├── supabase/{server,browser}.ts
│   │   │   ├── theme.ts               # ThemePreference type + cookie name + helpers
│   │   │   └── uiSize.ts              # UiSizePreference type + cookie name + helpers
│   │   └── proxy.ts                   # Auth gate + session refresh (Next 16 middleware)
│   ├── public/
│   ├── scripts/                       # Dev seeds, etc.
│   ├── tests/integration/             # Vitest, grouped by feature
│   ├── next.config.ts, vitest.config.ts, tsconfig.json
│   └── supabase/migrations/           # 0001–0014 SQL
└── docs/                              # design.md, architecture.md, UBIQUITOUS_LANGUAGE.md, prd-v1.md
```

---

## 3. Server / Client boundary

| Context | Supabase client | Source |
|---|---|---|
| Page / Layout / async Server Component | `createSupabaseServerClient()` | `src/lib/supabase/server.ts` |
| Server Action (`'use server'`) | `createSupabaseServerClient()` | same |
| Client Component (`'use client'`) | `createSupabaseBrowserClient()` | `src/lib/supabase/browser.ts` |
| Auth gate (request middleware) | `createServerClient` inlined | `src/proxy.ts` |

Rules:
- Never import `@/lib/supabase/server` in a `'use client'` file.
- Mutations live in Server Actions under `src/app/actions/`. Client components import and pass them to `useActionState` / form `action`.
- Action results use discriminated unions (e.g. `{ data } | { error }`); narrow with `'error' in result`.

### Auth gate — `src/proxy.ts`

- Uses `supabase.auth.getUser()` (validates JWT). **Never** `getSession()` in a gate — unverified.
- Public paths: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/invite/*`.
- Unauthenticated → `307 /login?next=<originalPath>`.
- Rewrites `Set-Cookie` for refreshed sessions on every request.

---

## 4. Server Actions inventory

All files under `src/app/actions/` start with `'use server'`.

### `auth.ts`
- `registerAction(prev, formData)` — sign up + email verify
- `loginAction(prev, formData)` — password sign in, honors `?next=`
- `logoutAction()` — void
- `forgotPasswordAction(prev, formData)` — trigger reset email
- `resetPasswordAction(prev, formData)` — consume reset token
- `changePasswordAction(prev, formData)` — re-auth + update

### `networks.ts`
- `createNetworkAction(prev, formData)` — calls `create_network` RPC
- `renameNetworkAction(formData)` — void
- `deleteNetworkAction(formData)` — void
- `leaveNetworkAction(formData)` — void
- `removeMemberAction(formData)` — void (owner only)

### `invitations.ts`
- `createInvitationAction(prev, formData)` — returns `{ token }` or `{ error }`
- `revokeInvitationAction(formData)` — void
- `joinByTokenAction(prev, formData)` — calls `join_by_token` RPC

### `spots.ts`
- `createSpotAction(formData)` → `SpotActionResult` — calls `create_spot` RPC, uploads media
- `updateSpotAction(...)` — calls `update_spot` RPC, reconciles media
- `deleteSpotAction(spotId)` — cascade via FK
- `getSpotDetailAction(spotId)` → `SpotDetailActionResult` (signs media URLs)
- `postCommentAction(spotId, body)` → `CommentActionResult`
- `removeMediaAction(...)` — deletes storage object + `media` row
- `getMySpotsAction()` → list for `/profile`
- `getMapSpotsAction()` → list for home map (with hero image signed URL)
- `searchSpotsAction(query)` → calls `search_spots` RPC

### `profile.ts`
- `updateUsernameAction(prev, formData)`
- `updateThemePreferenceAction(prev, formData)` — writes `profiles.theme_preference` + `ts_theme` cookie
- `updateUiSizeAction(prev, formData)` — writes `profiles.ui_size` + `ts_ui_size` cookie

Helpers re-used across actions:
- `parseStoragePath(urlOrPath)` in `actions/spots.ts` — extracts `{spot_id}/{filename}` path from a stored URL or raw path. Pair with `supabase.storage.from('media').createSignedUrl(path, 3600)` for 1h signed URL.

---

## 5. Data model

All tables in schema `public`. See `supabase/migrations/0001_initial_schema.sql` for authoritative DDL.

| Table | Purpose | Key columns | Notable FKs / cascades |
|---|---|---|---|
| `profiles` | Mirror of `auth.users` | `id` (= auth uid), `username unique`, `last_seen_at`, `theme_preference`, `ui_size` | `id → auth.users(id) on delete cascade`. Auto-created via `handle_new_user` trigger |
| `networks` | Private group | `id`, `name`, `owner_id`, `created_at` | `owner_id → profiles(id) on delete cascade` |
| `memberships` | User ↔ network (owner/member) | PK `(user_id, network_id)`, `role check in ('owner','member')` | both FKs cascade |
| `spots` | Point-of-interest | `id`, `author_id`, `title`, `description`, `lat`, `lng`, `state`, `date`, `created_at` | `author_id → profiles(id) on delete set null` |
| `spot_networks` | M:N spot ↔ network | PK `(spot_id, network_id)` | both cascade |
| `tags` | Unique tag names | `id`, `name unique` | — |
| `spot_tags` | M:N spot ↔ tag | PK `(spot_id, tag_id)` | both cascade |
| `comments` | Free text on spot | `id`, `spot_id`, `author_id`, `body`, `created_at` | spot cascade; author set null |
| `media` | Image/audio on spot | `id`, `spot_id`, `url`, `type check in ('image','audio')`, `name`, `created_at` | spot cascade. `name` added in 0008 |
| `invitations` | 7-day revocable token | `id`, `network_id`, `token`, `created_by`, `expires_at`, `revoked_at` | network cascade |

### Relationships
- A Spot has exactly one Author, ≥1 Networks (enforced at RPC), 0..* Tags / Comments / Media.
- Network membership is the trust boundary — visibility follows `spot_networks` → `memberships`.

---

## 6. RLS model

RLS on every `public` table. Two security-definer helpers avoid self-referential recursion on `memberships`:

- `is_network_member(uuid) → bool`
- `is_network_owner(uuid) → bool`

Any policy that needs to check membership **must** call these (never `JOIN memberships` directly).

Key policies (see `0002_rls_policies.sql`):

- `networks_select`: `is_network_member(id)`
- `memberships_select`: `is_network_member(network_id)`
- `spots_select`: `exists(spot_networks sn where sn.spot_id = spots.id and is_network_member(sn.network_id))` — an orphan spot (no network row) is invisible even to its author.
- `spots_insert/update/delete`: `auth.uid() = author_id`
- `spot_networks_select`: `is_network_member(network_id)`
- `spot_networks_insert`: only if `auth.uid()` is the spot's author
- `media_select`: network members of the spot's networks; `insert/delete`: author only
- `invitations_select/insert`: network members (insert further gated to authors of valid link creation flow)

### Storage RLS

Bucket `media` is **private**. Objects follow path convention `{spot_id}/{filename}`. Policies in `0004_storage_object_policies.sql` use `storage_spot_id(name)` to extract the spot id.

- `select`: member of any of the spot's networks
- `insert`: spot author
- `delete`: spot author

Client code **never** uses public URLs. All reads go through server-signed URLs (1h TTL) via `createSignedUrl` / `createSignedUrls`.

---

## 7. Postgres functions / RPCs

| RPC | Security | Called from | Purpose |
|---|---|---|---|
| `create_network(p_name)` | DEFINER | `createNetworkAction` | Atomic insert of `networks` + owner `memberships` row. Needed because `networks_select` requires membership to exist before the owner can read their own row. |
| `create_spot(...)` | DEFINER | `createSpotAction` | Atomic insert of `spots`, `spot_networks`, upsert `tags`, `spot_tags`. DEFINER required: `spot_networks_insert` subqueries `spots`, and `spots_select` requires a `spot_networks` row — chicken-and-egg. See migration 0011 commentary. |
| `update_spot(...)` | DEFINER | `updateSpotAction` | Re-sync tags + networks. Author-only. |
| `lookup_invitation(p_token)` | DEFINER, anon-callable | `invite/[token]/page.tsx` | Returns network name + status (`valid` \| `expired` \| `revoked` \| `not_found`) before sign-in. |
| `join_by_token(p_token)` | DEFINER, authenticated | `joinByTokenAction` | Validates token and upserts membership (ON CONFLICT DO NOTHING). |
| `search_spots(p_query)` | INVOKER, authenticated | `searchSpotsAction` | Case-insensitive match on title or tag; returns ≤10 results. RLS on `spots` filters to visible spots automatically because it runs as the caller. |

---

## 8. Storage

- Bucket: `media`
- Size limit: `20 MB` (20,971,520 bytes) — audio cap; image cap enforced app-side
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`, `audio/mpeg`, `audio/wav`, `audio/mp4`
- Path convention: `{spot_id}/{filename}`
- Read path: server-side `createSignedUrl(path, 3600)` ⇒ 1-hour signed URL, rendered into JSON / props. Never expose raw storage paths to the client.
- Hero image: first `image`-type `media` row for a spot; pre-signed in `getMapSpotsAction` for pin hover tooltip and SpotCard thumbnail.

---

## 9. Realtime

Only `public.comments` is on the `supabase_realtime` publication.

Live pin updates were attempted (migrations 0009–0010) and reverted (`0011_revert_spot_realtime.sql`): SECURITY DEFINER on `create_spot` masked writes from the `authenticated` role so Realtime never delivered them; removing DEFINER caused RLS recursion. Current state: spots fetched once at page load; client updates locally after `createSpotAction`.

---

## 10. Auth flow

1. Register (`/register`) → Supabase sends confirm email → user lands on `/auth/confirm` (route handler exchanges `code` for session).
2. Login (`/login`) → password sign-in → redirect to `?next=` or `/`.
3. Session cookie set by `@supabase/ssr`. Proxy (`src/proxy.ts`) refreshes it on every request.
4. `handle_new_user` trigger creates a `profiles` row on auth user insert; username defaults from `raw_user_meta_data.username` or email local part.
5. Password reset: `/forgot-password` → Supabase reset email → `/reset-password` consumes token.
6. Invitations: `/invite/[token]` calls `lookup_invitation` (anon) before auth; after sign-in, `joinByTokenAction` → `join_by_token` RPC → membership row.

---

## 11. Theme + UI size SSR

`src/app/layout.tsx` reads cookies and sets attributes on `<html>`:

| Cookie | Values | Attribute | Default |
|---|---|---|---|
| `ts_theme` (`THEME_COOKIE`) | `light` \| `dark` \| `system` | `data-theme="light\|dark"` | `dark` |
| `ts_ui_size` (`UI_SIZE_COOKIE`) | `regular` \| `large` \| `xlarge` | `data-size` | `regular` |

- `system` resolves to `light` or `dark` at render based on `@media (prefers-color-scheme: dark)` in `globals.css`; no JS FOUC.
- Preference is stored twice: cookie (for SSR) and `profiles.theme_preference` / `profiles.ui_size` (for cross-device). `updateThemePreferenceAction` / `updateUiSizeAction` write both.
- `useTheme` / `useUiSize` are client hooks for live switching in Settings.

Source: `src/lib/theme.ts`, `src/lib/uiSize.ts`, `src/hooks/useTheme.ts`, `src/hooks/useUiSize.ts`.

---

## 12. Testing

- Runner: Vitest. **Not Jest** — never use `jest.*` APIs.
- `vitest.config.ts`: `environment: 'node'`, `sequence.concurrent: false`, `testTimeout: 20000`, alias `@` → `src`.
- Setup: `tests/integration/setup.ts` loads `.env.test` with a separate test Supabase project. Integration tests hit the real DB — mocks would hide RLS bugs.
- Seed helpers: `tests/integration/helpers/seed.ts` — `createUser`, `signIn`, `cleanupUsers`, `seedNetwork`, `seedMembership`, `seedSpot`, `seedInvitation`. Always clean up in `afterAll`.
- Directory mirrors features:
  ```
  tests/integration/
  ├── auth/            — session, password reset
  ├── networks/        — lifecycle (create/rename/delete/leave)
  ├── invitations/     — token lifecycle
  ├── spots/           — create, profile list
  ├── rls/             — author-write, visibility, cascade, leave, network-delete
  ├── map/             — network filter, pin hover
  ├── profile/         — settings, theme, UI size
  └── schema/          — invitations, storage
  ```

Run: `npm run test:integration` (or `:watch`).

---

## 13. Migrations timeline

`supabase/migrations/` — apply in order. Never mutate schema via the Supabase dashboard for tracked changes.

| File | Summary |
|---|---|
| `0001_initial_schema.sql` | Tables + `handle_new_user` trigger |
| `0002_rls_policies.sql` | RLS + `is_network_member`/`is_network_owner` helpers |
| `0003_storage.sql` | `media` bucket (private, 20MB) |
| `0004_storage_object_policies.sql` | `storage.objects` RLS via `storage_spot_id(name)` |
| `0005_create_network_fn.sql` | `create_network` RPC (DEFINER) |
| `0006_invitation_rpcs.sql` | `lookup_invitation`, `join_by_token` |
| `0007_create_spot_fn.sql` | `create_spot` RPC |
| `0008_spot_updates.sql` | `update_spot` RPC + `media.name` column |
| `0009_realtime_tables.sql` | (deprecated) Add spots/spot_networks/comments to realtime publication |
| `0010_fix_realtime_security.sql` | (deprecated) Attempted INVOKER fix |
| `0011_revert_spot_realtime.sql` | **Revert to DEFINER**. Only `comments` remains on realtime |
| `0012_search_spots_fn.sql` | `search_spots` RPC (INVOKER) |
| `0013_profile_theme_preference.sql` | `profiles.theme_preference` |
| `0014_profile_ui_size.sql` | `profiles.ui_size` |

---

## 14. Page inventory

All pages are Server Components unless noted; forms within them are Client Components.

| Route | Purpose |
|---|---|
| `/` | Interactive map (home). Data pre-fetched in parallel: spots, user's networks, current user |
| `/login`, `/register` | Auth entry |
| `/forgot-password`, `/reset-password` | Password reset flow |
| `/auth/confirm` | Route handler — exchanges email-confirm code for session |
| `/invite/[token]` | Invitation landing (anon-readable via `lookup_invitation`) |
| `/networks` | List caller's networks + create form |
| `/networks/[id]` | Network detail — members, invite generation, rename/delete/leave |
| `/profile` | "My Spots" list + edit/delete |
| `/settings` | Username, theme toggle, UI size toggle |
| `/settings/password` | Change password |

Non-map pages share `components/shared/PageNav.tsx` for navigation chrome.
