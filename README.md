# Embeddable Widget & Lead-Capture Platform

A platform where a customer creates a widget (a contact or signup form), pastes one script tag into any website, and receives the submissions in a dashboard. The public submission endpoint is built for the open internet: it validates every field, allows cross-origin requests, limits floods, filters spam, enriches each submission with geo data, and never lets a failing side effect break a submission.

## What it does

- Owners sign up and manage widgets through an authenticated API. Each owner only ever sees their own widgets and submissions.
- Every widget gets an embed snippet: `<script src="http://localhost:3001/widget.js?id=WIDGET_ID"></script>`
- The widget loads from a short-lived loader and a long-cached, versioned bundle, then draws the form from a cached public config.
- Visitors submit from any origin. The server validates, rate limits, filters spam with a honeypot, enriches with geo data (provider A, then provider B, then none), stores the row, and sends an email notification in a background job.
- Owners read their submissions and basic analytics (counts per day, per widget, per country) from the dashboard API.

## Architecture

```text
Widget Owner (authenticated)
    -> Widget Management API -> Widget DB (tenant-isolated) -> embed snippet

Customer Website (any origin)
    <script src="widget.js?id=123">
        -> GET /widgets/:id/config   (public, cached, CORS)
            -> render widget

Website Visitor
    -> POST /submissions   (public, CORS, protected)
        | validation          -> bad payload? 4xx, never 500
        | rate limit + spam   -> flood? 429, service stays up
        | geo enrichment      -> provider A -fails-> provider B -fails-> store anyway
        | store submission    (idempotent per Idempotency-Key)
        | email side effect   (background job, 3 attempts, failure must NOT block success)

Widget Owner (authenticated)
    -> Dashboard API <- submissions + stats
```

The code is split in three layers: `src/routes` (HTTP only), `src/services` (rules and side effects), and `src/repositories` (all SQL). Schema changes are SQL migrations in `migrations/`.

## Run it

You need Docker with Compose.

```text
git clone https://github.com/tawchifulislam/flyrank-capstone-widget-platform.git
cd flyrank-capstone-widget-platform
docker compose up --build -d
docker compose exec -T app npm run seed
```

The app is on <http://localhost:3001>. Check it with `curl http://localhost:3001/health`.

The app container reads its settings from `.env.example`, so no `.env` file is needed. The migrations run when the container starts. The seed step creates a demo owner and a demo widget (safe to run twice):

- Owner: `demo@example.com` with password `demo-password-123`
- Widget id: `demo-widget`

### Try the widget on a page from another origin

```text
npx -y serve customer-site -l 5500
```

Open <http://localhost:5500/demo.html>. The page is served from port 5500 and the API runs on port 3001, so the browser treats them as different origins.

### Run the checks

```text
bash scripts/test-probes.sh
```

This runs six checks against the running system and prints PASS or FAIL for each one (it takes about a minute because it waits for the rate limit window to pass). `bash scripts/clean-run.sh` removes everything including the database volume and starts again from nothing.

To switch off a provider or the email for a test, set the variable when starting:

```text
GEO_PROVIDER_A_ENABLED=false docker compose up -d
GEO_PROVIDER_A_ENABLED=false GEO_PROVIDER_B_ENABLED=false docker compose up -d
EMAIL_SIDE_EFFECT_FAIL=true docker compose up -d
```

In mock mode the headers `X-Mock-Geo-Down: a`, `X-Mock-Geo-Down: a,b`, and `X-Mock-Email-Fail: true` do the same for a single request, without a restart.

## API

Errors always have the shape `{ "error": "message" }`. Cross-owner access returns 404, so a widget id never reveals that it exists.

### Public

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok" }` |
| GET | `/widget.js?id=ID` | Embed loader, cache 5 minutes. Loads the versioned bundle. |
| GET | `/assets/widget.HASH.js` | Versioned bundle, cache 1 year and immutable. The hash comes from the file content. |
| GET | `/widgets/ID/config` | Small JSON config, `Cache-Control: public, max-age=60`, ETag, CORS. 404 for an unknown widget. |
| POST | `/submissions` | Body `{ "widgetId", "data": { ... }, "honeypot": "" }`. Optional header `Idempotency-Key` (8 to 100 characters of letters, digits, `-`, `_`). Returns 201 with `{ "id" }`, or 200 with the same id for a retried key. Errors: 400 invalid data or key, 404 unknown widget, 413 body over 10kb, 429 too many requests. |

### Owner (header `Authorization: Bearer TOKEN`)

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/auth/signup` | Body `{ "email", "password" }` (password 8 to 100 characters). 201 with `{ user, token }`. 409 if the email exists. |
| POST | `/api/auth/login` | 200 with `{ user, token }`. The token lasts one hour. 401 for bad credentials. |
| POST | `/api/widgets` | Create a widget. Body: `type` (`signup`, `contact`, `cta`), `title`, optional `description`, `buttonText`, `fields`, `displayOptions`. 201 with the widget and its `embedSnippet`. |
| GET | `/api/widgets` | List your widgets. |
| GET / PUT / DELETE | `/api/widgets/ID` | Read, replace (version goes up), or delete. 204 on delete. 404 if it is not yours. |
| GET | `/api/dashboard/submissions` | Your submissions, newest first. Query: `widgetId`, `limit` (1 to 100, default 20), `offset`. Never contains the visitor IP. |
| GET | `/api/dashboard/stats` | Query `days` (1 to 365, default 30). Returns `total`, `perDay`, `perWidget`, `perCountry`. |

A widget field looks like `{ "name": "email", "label": "Email", "type": "email", "required": true }`. Field types are `text`, `email`, `textarea`, and `number`.

## Configuration

All variables are listed with safe placeholder values in `.env.example`.

| Variable | Meaning |
| --- | --- |
| `PORT` | Port of the server (3001) |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing secret and lifetime. The placeholder secret is only for demos. |
| `PUBLIC_BASE_URL` | Base URL written into embed snippets |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Limit per IP and widget (5 per 10 seconds) |
| `IP_RATE_LIMIT_WINDOW_MS`, `IP_RATE_LIMIT_MAX` | Limit per IP across all widgets (60 per minute) |
| `GEO_MODE` | `mock` (two fake providers) or `real` (ip-api.com, then ipapi.co) |
| `GEO_PROVIDER_A_ENABLED`, `GEO_PROVIDER_B_ENABLED` | Switch a provider off |
| `GEO_PROVIDER_A_URL`, `GEO_PROVIDER_B_URL`, `GEO_TIMEOUT_MS` | Real provider settings |
| `EMAIL_MODE` | `mock`: the email is written to the console |
| `EMAIL_SIDE_EFFECT_FAIL` | Force every email attempt to fail |

## How the requirements are met

Every item has a pasted proof in [EVIDENCE.md](EVIDENCE.md). How the AI helped, where it was wrong, and what I changed is in [BUILDLOG.md](BUILDLOG.md). The design document is [DESIGN.md](DESIGN.md).

| Requirement | Where |
| --- | --- |
| Authenticated CRUD, tenant isolation, embed snippet | `src/routes/widgets.js`, `src/services/widgetService.js`, evidence section "Widget management" |
| Cached config, versioned bundle, widget on another origin | `src/routes/widgetPublic.js`, `src/routes/assets.js`, `src/public/widget-bundle.js`, evidence sections "Widget delivery" and "Run from a clean machine" |
| CORS and preflight, validation, safe storage | `src/middleware/publicCors.js`, `src/services/submissionService.js`, evidence section "Public submission API" |
| Rate limit and honeypot | `src/middleware/rateLimit.js`, evidence section "Abuse protection" |
| Provider fallback and safe side effect | `src/services/geoService.js`, `src/services/notificationService.js`, evidence section "Enrichment and safe side effects" |
| Dashboard | `src/routes/dashboard.js`, evidence section "Owner dashboard" |
| Idempotency | `migrations/003_idempotency.sql`, evidence section "Idempotency" |

## Known limitations

- The rate limit counters and the email job live in the memory of one server process. They reset on restart and are not shared between several copies of the server. A crash during email retries loses that job.
- After a flood on one widget, the same visitor is blocked on that widget until the window ends (10 seconds, `Retry-After` tells it). Other widgets and the rest of the API keep working.
- After a new bundle release the old bundle URL returns 404. A page that cached the old loader can miss the widget for up to 5 minutes.
- An idempotency key sent again with different data returns the first submission and does not report a mismatch. Keys never expire.
- Geo lookups are mocked by default, because a visitor on localhost has the address `::1`, which no provider can locate. Set `GEO_MODE=real` for real lookups.
- The email is only written to the console. Replace `sendEmail` in `src/services/notificationService.js` to use a mail server.
- The JWT secret and the demo owner password are public demo values. A real deployment must set its own secret.
- There is no password reset, no email check at signup, and no widget analytics beyond the dashboard counts.

## Repository layout

```text
src/routes          HTTP routes only
src/services        validation, spam, enrichment, side effects, rules
src/repositories    all database access
src/middleware      auth, CORS, rate limits
src/public          the widget bundle source
src/db              pool, migration runner, seed
migrations          SQL schema changes
customer-site       plain HTML pages that embed the widget (the second origin)
scripts             test and proof scripts
```
