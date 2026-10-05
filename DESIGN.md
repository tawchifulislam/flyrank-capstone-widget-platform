# Design Doc: Embeddable Widget & Lead-Capture Platform

## Problem

Customers want to add a signup or contact form to any website with one script tag, without building a backend. This platform lets a customer create a widget, embed it, and safely collect submissions from the public internet.

## Non-goal

No real hosting, domain, or CDN. The customer site is a plain HTML file served from a second local port.

## Data Model

### widgets

- id (public id used in the embed snippet)
- owner_id (the tenant, taken from the auth token)
- type (signup, contact, cta)
- title
- description
- button_text
- fields (list of form fields: name, label, type, required)
- display_options
- version (increases on each update, used for cache busting)
- created_at, updated_at

### submissions

- id
- widget_id (foreign key to widgets)
- owner_id (copied from the widget, for tenant isolation)
- data (the validated form values)
- ip
- country, city (nullable, filled by enrichment)
- created_at

### Indexes

- widgets: owner_id
- submissions: widget_id, created_at
- submissions: owner_id

### Tenancy rule

Every query on widgets and submissions filters by owner_id. A request never reads or writes a row that belongs to another owner.

## API Contracts

### Path 1: Owner manages widgets (authenticated)

- POST /api/widgets
- GET /api/widgets
- GET /api/widgets/:id
- PUT /api/widgets/:id
- DELETE /api/widgets/:id
- Header: Authorization: Bearer &lt;token&gt;
- Missing or invalid token: 401
- Widget belongs to another owner: 404
- Create and read responses include the embed snippet:
  `<script src="http://localhost:3001/widget.js?id=<widget_id>"></script>`

### Path 2: Customer site loads the widget (public, cached, CORS)

- GET /widget.js?id=<widget_id>
  - versioned bundle, Cache-Control: public, max-age=31536000, immutable
- GET /widgets/:id/config
  - small JSON payload, Cache-Control: public, max-age=60
  - unknown widget: 404

### Path 3: Visitor submits the form (public, CORS, protected)

- POST /submissions
- Body: { widgetId, data, honeypot }
- Steps in order:
  1. CORS and preflight (OPTIONS)
  2. Payload size limit: too large gives 413
  3. Validation: bad payload gives 400 with a JSON error
  4. Rate limit: too many requests gives 429
  5. Spam check: filled honeypot is rejected without telling the bot why
  6. Geo enrichment: provider A, then provider B, then store without geo
  7. Store the submission
  8. Side effect (email or webhook): failure is logged and never changes the response
- Success: 201 with { id }

### Dashboard (authenticated, owner only)

- GET /api/dashboard/submissions
- GET /api/dashboard/stats
  - counts over time, per widget, geo breakdown

## Embed Flow

1. The owner creates a widget through the management API and receives the embed snippet.
2. The owner pastes the snippet into the customer site.
3. The browser loads widget.js from the API. It is a versioned, long-cached file.
4. widget.js reads the widget id from its own script tag and calls GET /widgets/:id/config.
5. widget.js renders the form from the config into the page.
6. The visitor fills the form and submits. widget.js sends POST /submissions to the API from a different origin.
7. The API validates, rate limits, filters spam, enriches, stores, and returns 201 or a clean 4xx error.
8. The owner sees the submission and stats through the dashboard API.

## Layers

- routes: HTTP only, no business logic
- services: validation rules, spam check, enrichment, side effects
- repositories: all database access
