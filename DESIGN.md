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
