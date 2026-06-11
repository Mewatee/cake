# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the server (no npm install needed — zero dependencies)
node server/server.js
# or
npm start
```

Open `http://localhost:3000` (designer) or `http://localhost:3000/admin` (dashboard, default password: `cake-admin`).

**Must be opened through the server** — opening `index.html` directly breaks `/api` calls.

Override config via `server/.env` (copy from `server/.env.example`):
```bash
# Windows PowerShell
$env:ADMIN_PASSWORD="secret"; $env:PORT="8080"; node server/server.js
```

There are no tests, no build step, and no linter.

## Architecture

### Two deployment targets

The codebase serves **two hosting modes** from the same source:

| Mode | Entry point | How it works |
|------|-------------|--------------|
| **Local / Render** | `server/server.js` | Single Node HTTP server, serves `public/` as static files + handles `/api/*` routes itself |
| **Vercel** | `vercel.json` + `api/*.js` | Static `public/` via `@vercel/static`; each `api/*.js` is a separate serverless function. File storage doesn't work on Vercel — must use Supabase. |

Both modes share `lib/store.js`, `lib/auth.js`, and `lib/http.js`.

### Frontend (`public/`)

Three files make up the entire frontend:

- **`public/index.html`** — shell HTML; imports Three.js r128 from CDN, then `js/app.js`, then `js/ui.js`
- **`public/js/app.js`** — 3D engine: all Three.js scene setup, cake geometry, canvas textures, decoration placement, camera control, and order serialization. All key state (`cakeData`, `FLAVORS`, `DECOR_TYPES`, etc.) lives here as globals.
- **`public/js/ui.js`** — UI controller: builds the flavor/topping option cards, syncs controls ↔ `cakeData`, handles tab switching and tray. Loads after `app.js` and relies on its globals.
- **`public/admin.html`** — self-contained admin dashboard (login + orders table); no shared JS with the designer.

`app.js` defines a helper at the top for Twemoji CDN icons:
```js
var _TW = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';
function _ei(cp) { return '<img class="emo" src="' + _TW + cp + '.svg" alt="">'; }
```
All emoji in `FLAVORS` and `DECOR_TYPES` use `_ei('codepoint')` — use base codepoints (e.g. `'2764'` not `'2764-fe0f'`).

### Per-cake data model

Each of the 4 cakes in `cakeData[]` is:
```js
{
  color: '#aaccdf',    // frosting hex
  finish: 'satin',     // matte | satin | glossy | metallic
  flavor: 'vanilla',   // id from FLAVORS
  top: 'tarot_star',   // id from TOPPINGS (ui.js)
  t1, t2, t3,          // text lines on the cake top
  decorations: [       // user-placed 3D decorations
    { type, x, z, scale, rot, col, /* custom: */ customShape, drawnPts }
  ]
}
```

Calling `buildCake(i)` rebuilds cake `i` from scratch using `cakeData[i]`.

### Canvas texture system

All textures are generated at runtime via Canvas 2D API — no image assets:
- `sideTex(color)` — 512×256, frosting side with palette-knife strokes and a sponge crumb band at base (color from `flavor.s`)
- `topTex(data)` — 512×512, cake top with the selected center topping artwork painted programmatically
- `lidTex()` — 600×400, lid interior with constellation/celestial art

### Storage (`lib/store.js`)

Auto-selects backend based on env vars:
- **No Supabase vars** → `server/orders.json` (flat file, fine for local dev)
- **`SUPABASE_URL` + `SUPABASE_KEY` set** → Supabase Postgres via its PostgREST REST API

The startup log prints which mode is active. Supabase table schema is in `server/README.md`.

### Auth

Single shared admin password (`ADMIN_PASSWORD` env var, default `cake-admin`). `/api/login` issues a random bearer token stored in an in-memory `Map` (reset on server restart, 12h TTL). Admin routes check `Authorization: Bearer <token>`. The server **refuses to start in production** with the default password unless `ALLOW_DEFAULT_PASSWORD=1` is set.

### API routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/login` | — | `{password}` → `{token}` |
| POST | `/api/orders` | — | Save order → `{orderId}` |
| GET | `/api/orders` | admin | List orders |
| GET | `/api/order?id=…` | — | Full order JSON (used to re-open a design) |
| PATCH | `/api/status?id=…` | admin | Update order status |

Opening `/?order=ORD-…` in the designer auto-loads that order's design.
