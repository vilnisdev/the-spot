# PRD v1 — Coppice

## Problem Statement

Hikers, trail walkers, and nature lovers accumulate a wealth of knowledge about special places — a hidden waterfall, a trailhead with free parking, a scenic overlook most people walk past. Today there is no good place to store and share this knowledge with the people who matter. Existing options are either public social media platforms (too noisy, algorithmically addictive, full of ads and influencers) or generic note-taking apps (no map, no sharing, no community). People end up texting coordinates in group chats that get buried, or keeping notes to themselves that never get shared.

There is no app designed to be a trusted, private, digital scrapbook for the outdoors — something that feels like collecting national park stamps or trading postcards, not scrolling a feed.

## Solution

Coppice is a private nature spot-sharing app built around a shared interactive map. Members drop Pins on the map to create Spots — named, documented points of interest with photos, sound clips, descriptions, and tags. Spots are only visible to Members of trusted Networks: small, private groups that users create and invite friends into. There are no ads, no recommendation algorithm, no influencers, no scrolling, no push notifications. The app is designed to send users outside, not keep them on-screen.

The primary interface is the Interactive Map. Everything else — Networks, Profiles, search — is secondary. The aesthetic is Editorial Field Journal: ink on paper, serif typography, print-culture hierarchy. It should feel like opening a well-loved trail guide, not launching a social media app.

## User Stories

### Authentication & Profile

1. As a User, I want to register with an email address, username, and password, so that I can create an identity in the app.
2. As a User, I want to log in with my email and password, so that I can access my account and Networks.
3. As a User, I want to reset my password via email, so that I can recover my account if I forget my credentials.
4. As a User, I want to edit my username, so that I can update how I appear to Members of my Networks.
5. As a User, I want to change my password, so that I can keep my account secure.
6. As a User, I want to view my Profile page, so that I can see all the Spots I have created and manage them.
7. As a User, I want to toggle between light and dark mode in Settings, so that I can use the app comfortably in different lighting conditions.

### Networks

8. As a User, I want to create a Network with a name, so that I can establish a private shared map with people I trust.
9. As a User (Network Owner), I want to rename my Network, so that I can update it as the group evolves.
10. As a User (Network Owner), I want to delete my Network, so that I can remove a group that is no longer active.
11. As a User (Network Owner), I want to remove a Member from my Network, so that I can control who has access to our shared Spots.
12. As a Member, I want to generate an Invitation link for my Network, so that I can invite new people to join.
13. As a Member, I want the Invitation link to expire after 7 days, so that old links cannot be misused.
14. As a User (Network Owner), I want to revoke an Invitation link before it expires, so that I can stop unwanted access.
15. As a User, I want to join a Network by clicking an Invitation link, so that I can access the shared map for that group.
16. As a new User, I want to register and automatically join a Network when I follow an Invitation link, so that the onboarding flow is seamless.
17. As a Member, I want to leave a Network, so that I can remove myself from a group I no longer want to be part of.
18. As a User, I want to belong to multiple Networks simultaneously, so that I can maintain separate groups for different hiking communities.
19. As a Member, I want to see who else is a Member of my Network, so that I know who can see our shared Spots.

### The Interactive Map

20. As a Member, I want to see the Interactive Map as the primary interface when I open the app, so that Spots are immediately accessible.
21. As a Member, I want to see Pins on the map for all Spots visible to me across my Networks, so that I can explore places my network has documented.
22. As a Member, I want to see only Pins from Members of my own Networks, so that my map remains private to my trusted groups.
23. As a Member, I want to filter the map by Network from the side panel, so that I can focus on one group's Spots at a time.
24. As a Member, I want the map to show all Networks' Pins by default, so that I get a full picture of my shared geography without extra steps.
25. As a Member, I want to click a Pin on the map to open the Spot Modal, so that I can read the full details of a Spot.
26. As a Member, I want the map to update in real-time when a Network member adds a new Spot, so that I see new Pins without refreshing the page.
27. As a Member, I want to pan and zoom the map freely, so that I can explore at any scale.

### Dropping Pins & Creating Spots

28. As a Member, I want to tap an "Add Spot" button to enter Drop mode, so that I can begin creating a new Spot.
29. As a Member in Drop mode, I want visual feedback (cursor change, on-screen prompt) that I am about to place a Pin, so that the interaction is clear.
30. As a Member, I want to click anywhere on the map in Drop mode to place a provisional Pin, so that I can specify the Spot's location precisely.
31. As a Member, I want a creation form to slide up from the bottom of the screen after dropping a Pin, so that I can fill in the Spot's details without leaving the map.
32. As a Member, I want the Spot's Location (latitude, longitude, and US state) to be auto-filled from where I dropped the Pin, so that I don't have to enter coordinates manually.
33. As a Member, I want the Spot's Date to be auto-filled with today's date, so that I don't have to enter it manually.
34. As a Member, I want the Spot's Author to be auto-filled with my username, so that authorship is recorded without extra steps.
35. As a Member, I want to edit any auto-filled field before saving, so that I can correct or adjust them.
36. As a Member, I want to enter a title for my Spot, so that it has a human-readable name on the map.
37. As a Member, I want to write a description for my Spot, so that I can capture field notes, observations, and context.
38. As a Member, I want to add Tags to my Spot, so that it can be related to other Spots with shared characteristics.
39. As a Member, I want to upload photos to my Spot, so that I can document what the place looks like.
40. As a Member, I want to upload sound clips to my Spot, so that I can capture ambient audio (birdsong, water, wind).
41. As a Member, I want to select which of my Networks the Spot belongs to (one or more), so that I can control who sees it.
42. As a Member, I want to cancel the creation form and remove the provisional Pin, so that I can start over or abandon the action.
43. As a Member, I want the new Pin to appear on the map immediately after saving, so that I get instant visual confirmation.

### Spot Modal & Detail

44. As a Member, I want to click a Pin to open the Spot Modal, so that I can view a Spot's full details.
45. As a Member, I want to see the Spot's title, description, Location, Date, Author, Tags, and Media in the Spot Modal, so that I have all the information in one place.
46. As a Member, I want to see photos and listen to sound clips attached to a Spot, so that I can experience the place through Media.
47. As a Member, I want to read Comments left on a Spot by other Members, so that I can see what others have said about it.
48. As a Member, I want to leave a Comment on a Spot, so that I can add my own notes or reactions.
49. As the Author of a Spot, I want an edit option in the Spot Modal, so that I can update any field.
50. As the Author of a Spot, I want a delete option in the Spot Modal, so that I can remove a Spot I no longer want to share.
51. As a Member, I want to close the Spot Modal by tapping outside it or pressing a close button, so that I can return to the full map view.

### Search

52. As a Member, I want a search bar fixed to the bottom of the Interactive Map, so that I can find Spots without navigating away from the map.
53. As a Member, I want to search by Spot title, so that I can find a specific place by name.
54. As a Member, I want to search by Tag, so that I can find all Spots sharing a common characteristic.
55. As a Member, I want search results to be limited to Spots visible to me through my Networks, so that I never see Spots from outside my trusted groups.
56. As a Member, I want to see a short list of matching Spots when my search returns multiple results, so that I can choose the right one.
57. As a Member, I want the map to Fly-to a Spot and open its Modal when I select a search result, so that I go directly to the place I was looking for.

### Profile & My Spots

58. As a Member, I want to view all Spots I have created (across all Networks) on my Profile page, so that I have a personal record of everywhere I've documented.
59. As a Member, I want to see which Network each of my Spots belongs to on the My Spots list, so that I can understand its visibility context.
60. As a Member, I want to click a Spot in My Spots list to open its Modal, so that I can view or edit it.
61. As a Member, I want to edit a Spot from My Spots list, so that I can update details without having to find its Pin on the map.
62. As a Member, I want to delete a Spot from My Spots list, so that I can remove it without hunting for its Pin.

### Side Panel & Navigation

63. As a Member, I want a hamburger menu icon on the left side of the screen, so that I can access navigation without a persistent navbar cluttering the map.
64. As a Member, I want the side panel to show links to Profile, My Spots, Networks, and Settings, so that all primary navigation is in one place.
65. As a Member, I want the side panel to show a list of my Networks with a filter option, so that I can switch the map between all Networks and a single Network view.
66. As a Member, I want the side panel to close when I tap the map, so that it gets out of the way quickly.
67. As a Member, I want a notification badge on the hamburger icon when there are new Spots or Comments in my Networks since I last opened the app, so that I know there's something new without being pushed a notification.

### Responsive & Mobile

68. As a mobile user, I want the full app to work on a 375px screen, so that I can use it on my phone while out on a trail.
69. As a mobile user, I want the Spot Modal to stack vertically on narrow screens, so that I can read it without horizontal scrolling.
70. As a mobile user, I want the side panel to be full-width on mobile, so that navigation links are easy to tap.
71. As a mobile user, I want the "Add Spot" button and search bar to be easily reachable with a thumb, so that I can use the app one-handed.

---

## Implementation Decisions

### Stack
- **Frontend:** React with Next.js (App Router), deployed on Vercel
- **Backend / Database:** Supabase — PostgreSQL, Auth, Storage, and Realtime WebSocket subscriptions
- **Map:** React-Leaflet with OpenStreetMap tiles (light mode) and Stadia Alidade Smooth Dark (dark mode)
- **Design system:** CSS custom properties from `docs/design.md` (Editorial Field Journal). No Tailwind. CSS Modules per component.

### Data Model (key decisions)
- A Spot belongs to one or more Networks via a `spot_networks` join table (many-to-many)
- A User's membership in a Network is tracked in a `memberships` table with a `role` field: `owner` or `member`
- Any Member (not just the Owner) may generate an Invitation link
- Invitations expire after 7 days and are multi-use; the Owner can revoke them early
- When a Member leaves or is removed from a Network, their Spots remain visible to remaining Members
- Media is stored in Supabase Storage (private bucket, served via signed URLs); supported types: images (JPEG/PNG/WebP, max 10MB), audio (MP3/WAV/M4A, max 20MB). Video is out of scope for v1.
- A `last_seen_at` timestamp on the `profiles` table drives the in-app notification badge

### Visibility / Security
- Row-Level Security on the `spots` table: a Spot is only visible if the requesting user is a Member of at least one of its Networks
- Only the Author can update or delete their own Spot (RLS policy)
- Invitation tokens are validated server-side before granting Network access

### Auth
- Email + password via Supabase Auth
- Password reset via email link
- Invitation flow: unauthenticated user clicks link → if not logged in, redirected to register with the token preserved in the URL → on successful registration, user is auto-joined to the Network

### Map & Real-time
- React-Leaflet is dynamically imported (`next/dynamic`, `ssr: false`) since Leaflet requires a browser environment
- Supabase Realtime subscriptions are used for: new Spot inserts (adds Pin to map), Spot deletes (removes Pin), new Comments (updates comment count/thread in open Modal)
- Pin markers are custom SVG teardrops (sepia / accent fill) via `L.divIcon`, matching the prototype design
- US State is reverse-geocoded server-side using Nominatim when a Spot is created

### Notification Badge
- On app load, count of Spots and Comments created after `profiles.last_seen_at` in the user's Networks
- `last_seen_at` is updated each time the user opens the app
- Badge is a dot on the hamburger icon; no push notifications, no emails

### Routing
- `/` — Interactive Map (protected)
- `/login`, `/register` — auth pages
- `/invite/[token]` — public join page
- `/profile` — Profile + My Spots
- `/networks` — Network list + create
- `/networks/[id]` — Network detail, Members, Invitation management

### Search
- Searches Spot `title` (ilike) and `tags.name` (ilike) within the user's visible Spots (RLS-enforced)
- Multiple results show a short list above the search bar before flying to a selection
- Single result flies directly and opens the Spot Modal

---

## Testing Decisions

### What makes a good test
Test external behavior, not implementation details. A good test verifies what a module does (its output given some input), not how it does it internally. Tests should remain valid through refactors that don't change behavior.

### Modules to test

| Module | What to test |
|---|---|
| Spot visibility (RLS) | A Member only sees Spots in their Networks; a User outside the Network sees nothing |
| Invitation flow | Valid token → user joined; expired token → rejected; revoked token → rejected |
| Spot creation | Spot saved with correct author, location, date; spot_networks join records created correctly |
| Search | Returns Spots matching title or tag; never returns Spots outside the user's Networks |
| Member leave | Spots remain after Member leaves; ex-Member loses read access |
| Spot delete | Author can delete; non-Author cannot; associated media + tags + comments cascade-deleted |
| Network delete | All Spots lose that Network's membership; Spots shared with other Networks remain |
| In-app badge count | Badge count reflects only Spots/Comments after `last_seen_at`; resets to 0 on app open |

### Testing approach
- RLS and data lifecycle rules: integration tests against a real Supabase test project (not mocked), to prevent the class of bugs where mock/prod divergence masks broken behavior
- React components: behavior tests (React Testing Library) — test what renders and what happens on interaction, not internal state
- API routes: test with real Supabase test credentials; no mocking the database

---

## Out of Scope (v1)

- **Video uploads** — media is limited to images and sound clips
- **Push notifications** — no email digests, no browser push, no mobile push
- **Native mobile app** — responsive web only
- **Public Spots** — all Spots are private to Networks; no public map
- **Influencer or corporate accounts** — no account tiers, no verified badges
- **Recommendation algorithm** — no "suggested Spots", no trending, no discovery feed
- **Offline mode** — no service worker or local caching of map data
- **Social login (Google/Apple)** — email + password only in v1 (magic link support deferred)
- **Spot reactions / likes** — Comments are the only social interaction
- **Direct messaging between Members**
- **Moderation tools beyond Owner removing Members**
- **Analytics or usage tracking**

---

## Further Notes

- **Domain language:** All UI copy and code must follow the terms in `docs/UBIQUITOUS_LANGUAGE.md`. Key: a **Spot** is the entity, a **Pin** is its map marker — never conflate them. "Network" not "group" or "server". "Member" in Network context, "User" in auth context.
- **Design system:** All visual decisions are locked in `docs/design.md` (Editorial Field Journal aesthetic). Serif-only typography (Playfair Display + Source Serif 4), ink-on-paper palette, no glassmorphism, no gradient buttons.
- **Anti-addictive by design:** The app must not implement any pattern that maximises time-on-screen. No infinite scroll, no notification hooks, no engagement metrics. Every UI decision should be evaluated against the question: "does this get people outside, or does it keep them on a screen?"
