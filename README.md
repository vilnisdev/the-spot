# Coppice

Private nature spot-sharing app. Members drop Pins on a shared interactive map to create Spots — named points of interest with photos, sound clips, descriptions, and tags. Spots are only visible to Members of trusted Networks. No ads, no algorithm, no feed.

Stack: Next.js (App Router) · Supabase (Postgres + Auth + Storage + Realtime) · React-Leaflet + OpenStreetMap · CSS Modules

---

## Prerequisites

- Node.js 20+
- A Supabase project (for dev and a separate one for tests)

---

## Setup

```bash
cd app
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply migrations to your Supabase project via the Supabase CLI or dashboard (`supabase/migrations/`).

---

## Dev server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3001).

---

## Tests

Integration tests run against a **real Supabase test project** — no mocking the database.

### 1. Configure test credentials

Copy `.env.test.example` to `.env.test` and fill in credentials for a dedicated test Supabase project:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Use a separate project from dev — tests create and destroy data freely.

### 2. Run tests

```bash
# Run all integration tests once
npm run test:integration

# Watch mode (re-runs on file change)
npm run test:integration:watch
```

Tests live in `tests/integration/` and cover:

| Suite | What it verifies |
|---|---|
| `rls/spot-visibility` | Member sees only Spots in their Networks; outsiders see nothing |
| `rls/author-write` | Author can edit/delete; non-author cannot |
| `rls/member-leave` | Spots remain after Member leaves; ex-Member loses read access |
| `rls/network-delete` | Spots shared with other Networks survive; orphaned Spots handled |
| `rls/cascade` | Deleting a Spot removes associated media, tags, and comments |
| `schema/invitations` | Valid token joins user; expired/revoked tokens rejected |
| `schema/storage` | Media upload/retrieval via signed URLs |

---

## Project structure

```
app/
  src/
    app/          # Next.js App Router pages and layouts
    components/   # React components (CSS Modules per component)
    lib/          # Supabase client, utilities
  supabase/
    migrations/   # SQL migrations
  tests/
    integration/  # Vitest integration tests (real Supabase)
      helpers/    # Seed helpers and test utilities
      rls/        # Row-Level Security tests
      schema/     # Invitation and storage tests
```

---

## Domain language

- **Spot** — the entity (data, metadata, media). Never "post" or "place".
- **Pin** — the map marker representing a Spot. Never conflate with Spot.
- **Network** — a private group. Never "group" or "server".
- **Member** — a user within a Network context. **User** in auth context.

Full glossary: `docs/UBIQUITOUS_LANGUAGE.md`
