# V2 Todos

Things deliberately deferred from v1. Revisit once v1 is stable and usage patterns are understood.

---

## Media

- **Video uploads** — Media definition includes video as a valid domain concept, but v1 supports images and sound clips only. Defer until storage costs and upload UX complexity are better understood.

## Auth

- **Magic link (passwordless)** — Email + password is v1 auth. Magic link is a clean upgrade path with minimal schema changes. Deferred until there's evidence of password friction.
- **Social login (Google / Apple)** — Adds convenience at the cost of third-party dependency. Revisit if onboarding drop-off is a problem.

## Notifications

- **Push notifications** — No push in v1 by design (anti-addictive ethos). Revisit only if Members express frustration missing new Spots from their Networks.
- **Email digest (weekly)** — Opt-in weekly summary of new Spots in your Networks. Low-disruption alternative to push. Deferred to v2.

## Social

- **Spot reactions** — Likes or emoji reactions on Spots. Deliberately excluded from v1 to avoid engagement-metric thinking. Revisit with caution.
- **Direct messaging between Members** — Out of scope. The app is about Spots, not chat.

## Platform

- **Native mobile app (iOS / Android)** — v1 is responsive web only. Native adds GPS integration, offline maps, and camera access. High effort; evaluate after web usage patterns are clear.
- **Offline mode** — Service worker caching of visible Spots and map tiles. Useful for areas with poor trail coverage. Deferred.
- **Public Spots** — All Spots are private to Networks in v1. A future "public" toggle per Spot could allow discovery, but risks undermining the trust-based ethos. Needs careful design.

## Moderation

- **Admin role in Networks** — v1 has `owner` and `member` only. An `admin` role (can invite + remove Members) would help larger Networks. Deferred until Networks grow beyond ~10 people.
- **Spot reporting** — No moderation tools in v1 beyond the Owner removing Members. Add if abuse becomes a real concern.
