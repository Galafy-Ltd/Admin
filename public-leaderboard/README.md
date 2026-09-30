# Galafy public live leaderboard

Lightweight Vite + React site for shared event leaderboards (no login).

**Mobile host API handoff:** `gala/PUBLIC_LEADERBOARD_MOBILE_HANDOFF.md` in the API repo (endpoints, request/response shapes, privacy toggles).

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Runs on http://localhost:5174

## Env

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api` |
| `VITE_SOCKET_URL` | `http://localhost:3000` |
| `VITE_APP_DOWNLOAD_URL` | `https://galafy.com/download` |
| `VITE_DEFAULT_OG_IMAGE` | Absolute URL to default share image |

## Social share previews (OG / Twitter)

`/e/:token` is rewritten to an Edge function (`api/share.ts`) that injects dynamic
`og:title`, `og:description`, `og:image` (and Twitter equivalents) into the HTML
before crawlers see the page. Amounts appear in the description only when the
event has `showAmounts` enabled; emails and profile details are never included.

## Routes

- `/e/:token` — public live leaderboard page

Host APIs (mobile) on the Nest backend:

- `PUT /api/events/:id/public-leaderboard` — enable/revoke + privacy toggles
- `POST /api/events/:id/public-leaderboard/regenerate` — rotate share token
- `GET /api/public/leaderboard/:token` — privacy already applied server-side

Privacy body fields (all optional except `enabled`):

| Field | Effect |
|-------|--------|
| `showNames` | Hide names → `Anonymous` (no avatars) |
| `showAmounts` | Hide per-sprayer amounts |
| `showTotalAmount` | Hide aggregate total sprayed |
| `showParticipantCount` | Hide givers count |
| `allowAnonymous` | Opted-out users appear as Anonymous; if false they are omitted |
| `topN` | Limit public ranks (1–100), or `null` for full list |
| `regenerate` | Rotate token while enabling |

Set backend `PUBLIC_LEADERBOARD_BASE_URL` to this site’s origin (e.g. `https://live.galafy.com`).

From the admin repo root:

```bash
npm run dev:leaderboard
npm run build:leaderboard
```
