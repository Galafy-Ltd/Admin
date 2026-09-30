# Galafy public live leaderboard

Lightweight Vite + React site for shared event leaderboards (no login).

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

## Routes

- `/e/:token` — public live leaderboard page

Host APIs (mobile) on the Nest backend:

- `PUT /api/events/:id/public-leaderboard` `{ enabled, showAmounts }`
- `GET /api/public/leaderboard/:token`

Set backend `PUBLIC_LEADERBOARD_BASE_URL` to this site’s origin (e.g. `https://live.galafy.com`).

From the admin repo root:

```bash
npm run dev:leaderboard
npm run build:leaderboard
```
