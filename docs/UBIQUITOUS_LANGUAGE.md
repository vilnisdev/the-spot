# Ubiquitous Language — The Spot

## Core Domain

| Term | Definition | Aliases to avoid |
|---|---|---|
| **Spot** | A named point of interest on the map, created by a Member, belonging to one or more Networks | POI, location, place, post, entry |
| **Pin** | The visual map marker that represents a Spot on the interactive map | Marker, dot, icon, pushpin |
| **Network** | A named, private group of Members who share a common map view | Community, group, server, team, circle |
| **Member** | A User who belongs to a specific Network | Follower, friend, contact, user (in Network context) |
| **Author** | The Member who created a Spot | Creator, poster, owner, uploader |
| **Invitation** | A unique link that grants a User access to join a Network | Invite link, referral, share link |
| **Tag** | A short label attached to a Spot used to relate it to other Spots with shared characteristics | Category, label, hashtag, keyword |
| **Comment** | A text note left on a Spot by any Member who can see it | Reply, note, response |
| **Media** | Images, videos, or sound clips attached to a Spot | Attachment, upload, file, asset |
| **Profile** | A User's identity within the app, including username and credentials | Account, user page, bio |

## People

| Term | Definition | Aliases to avoid |
|---|---|---|
| **User** | An authenticated identity in the system | Account, login, person |
| **Member** | A User in the context of a specific Network — a User becomes a Member upon joining | Participant, subscriber |
| **Author** | A Member in the context of a specific Spot they created | Owner, creator, poster |

## Map & Navigation

| Term | Definition | Aliases to avoid |
|---|---|---|
| **Interactive Map** | The primary interface — a pannable, zoomable map that displays Pins for all visible Spots | Map view, canvas, map screen |
| **Pin** | The clickable map marker for a Spot; clicking opens the Spot Modal | Marker, dot, pushpin |
| **Spot Modal** | The panel that opens when a Pin is clicked, displaying a Spot's full details | Popup, drawer, detail view, card |
| **Fly-to** | The animated map transition that moves the viewport to a Spot's location | Pan, jump, navigate, zoom-to |
| **Drop** | The act of placing a Pin on the map to begin creating a new Spot | Place, add, create (in map context) |

## Spot Details

| Term | Definition | Aliases to avoid |
|---|---|---|
| **Location** | The geographic coordinates (latitude/longitude) and US state (if applicable) of a Spot, auto-filled from the Drop point | Coordinates, position, address |
| **Date** | The calendar date the Spot was created, auto-filled and editable | Timestamp, created-at |
| **Description** | Free-form text field on a Spot that captures the Member's field notes | Body, content, notes, caption |
| **Tag** | A short label on a Spot used to surface related Spots | See core domain above |

## Relationships

- A **Spot** is created by exactly one **Author**.
- A **Spot** is visible only to **Members** of the **Networks** it belongs to.
- A **User** belongs to zero or more **Networks** simultaneously.
- A **Network** has one or more **Members**.
- A **Network** is joined via an **Invitation**.
- A **Pin** represents exactly one **Spot** on the **Interactive Map**.
- A **Spot** has one **Pin**.
- **Members** who can see a **Spot** may leave **Comments** on it.
- A **Spot** may have zero or more **Tags**, **Comments**, and **Media** items.

## Example Dialogue

> **Dev:** "When a **Member** drops a **Pin**, does a **Spot** get created immediately?"

> **Domain expert:** "The **Drop** opens the Spot creation form pre-filled with **Location** and **Date**. The **Spot** isn't saved until the **Member** submits it — so the **Pin** is provisional until then."

> **Dev:** "Which **Networks** does the **Spot** belong to? All of the **Author's** Networks?"

> **Domain expert:** "The **Author** chooses. They might be in three **Networks** but only share the **Spot** with one. **Members** of the other two **Networks** won't see the **Pin** at all."

> **Dev:** "Can a **Member** see a **Spot** they didn't create?"

> **Domain expert:** "Yes — any **Member** of a **Network** that the **Spot** belongs to sees its **Pin** on the **Interactive Map**. Clicking it opens the **Spot Modal**. Only the **Author** can edit or delete the **Spot**."

> **Dev:** "What's the difference between a **Tag** and a **Network**?"

> **Domain expert:** "A **Network** controls visibility — it's a trust boundary. A **Tag** is just a label for relating **Spots** to each other. Two **Spots** with the same **Tag** might be in completely different **Networks**."

## Flagged Ambiguities

- **"Hub"** — used in the product description ("a hub for hikers") but should not appear in code or UI copy. The canonical term is the app name: **The Spot**. "Hub" is marketing language.
- **"User" vs "Member"** — a **User** is the authentication identity (exists in the auth system). A **Member** is a **User** in the context of a **Network**. In UI copy, prefer "Member" when referring to someone within a Network context; prefer "User" only for auth/profile contexts (login, profile settings).
- **"Pin" vs "Spot"** — these are related but distinct. A **Spot** is the domain entity (the data, the story, the field note). A **Pin** is its map representation. You drop a **Pin** to create a **Spot**; you click a **Pin** to open a **Spot Modal**. Never use them interchangeably in code or copy.
- **"Network"** — avoid "server" (Discord connotation), "group" (too generic), or "community" (implies public). **Network** is the canonical term: small, private, trust-based.
- **"Scrapbook"** — used in product intent descriptions to convey the design philosophy (not addictive, precious, collected). It is not a domain term and should not appear in UI labels or code. It describes the *feeling*, not a feature.
