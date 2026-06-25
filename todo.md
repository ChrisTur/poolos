# PoolOS — Todo

> Items marked ⚡ are direct competitive gaps vs. PoolBrain.

## Build Now (no external blockers, ranked by impact)

- [ ] ⚡ Equipment registry per customer — store equipment (pump, filter, heater, sanitizer type, salt cell) with model, serial number, install date, and notes; visit form adapts based on equipment (e.g., hide salt reading if no salt cell)
- [ ] ⚡ Issue reports — technicians flag problems mid-visit with category (leak, equipment failure, safety hazard, etc.), photos, and notes; visible to all staff and linked to the visit
- [ ] ⚡ Customer feedback — one-click satisfaction rating sent after proof-of-service email; score stored per visit; low scores trigger a staff alert before a customer leaves a public review
- [ ] ⚡ Job templates — one-click pre-built workflows for common tasks: pool opening, closing, filter clean, acid wash, pump prime; reduces setup time for recurring jobs
- [ ] ⚡ Chemical cost & usage tracking — log which chemicals were added and the quantity per visit; track cost per chemical per customer, technician, and company-wide; dashboard widget showing chemical spend vs. revenue
- [ ] Digital signatures on estimates — customers sign online via the customer portal
- [ ] ⚡ Estimate approval workflow — customers approve or deny estimates from the portal; approved estimates auto-convert to a scheduled job; denial prompts a reply
- [ ] Data export — let companies download all their data (GDPR requirement)
- [ ] Sentry error alerting — configure alert rules so critical errors page on-call (already integrated, just needs rules)

## Medium Effort / Real Value

- [ ] Chemical trend alerts — flag customers whose readings are consistently out of range
- [ ] ⚡ Multiple bodies of water — track pool + spa + water feature separately per customer, each with its own readings, pricing, workflow, and chemical history
- [ ] ⚡ Filter / equipment clean auto-scheduling — auto-create filter clean and salt cell clean jobs based on a configurable interval; auto-update last-cleaned date after completion
- [ ] ⚡ Technician scorecards — per-tech performance dashboard: visits completed, avg chemical spend per stop, customer satisfaction scores, and open alert trends
- [ ] ⚡ Drag-and-drop route scheduling — rearrange stops within a route and move stops between days via drag-and-drop; unscheduled queue for pending jobs
- [ ] ⚡ Interactive report charts — clickable bars/points on report charts that drill down to the underlying invoices, visits, or customers
- [ ] Equipment maintenance log — `EquipmentService` records (date, work done, parts used); links to the equipment registry entry

## Setup Overhead / External Dependency

- [ ] SMS notifications — Twilio integration; start A2P 10DLC registration now (takes 2–4 weeks)
- [ ] QuickBooks Online integration — two-way sync of customers, invoices, payments, refunds, and service categories; needs QBO developer account
- [ ] Auto-invoicing — generate monthly invoices for customers with a `monthlyRate` (waiting on GCP Cloud Scheduler)
- [ ] ⚡ ACH / bank transfer payments — Stripe ACH option on invoices and customer portal; lower processing fees than card; daily retry on declines
- [ ] ⚡ Technician payroll calculations — automated pay based on jobs completed; configurable rates per employee, property, body of water, and service level
- [ ] Mobile PWA — installable on homescreen with offline visit-log drafting (PoolBrain's biggest differentiator: full offline operation with auto-sync)

## Hold (partner approval / premature)

- [ ] Heritage Pool+ integration — nightly product catalog sync; requires partner approval (customersupport@heritagepoolplus.com)
- [ ] LaMotte Bluetooth integration — auto-fill chemical readings from device (Web Bluetooth API)
- [ ] AI phone receptionist — inbound call handling add-on ($99/mo, Bland AI / Vapi)
- [ ] Consumer financing — Sunbit or similar payment plan option on invoices

## Marketing & SEO

- [ ] Google Search Console — track impressions, clicks, and crawl errors after launch

## Infrastructure & Operations

### Cloud Migration (Netlify → Google Cloud Run)
- [ ] Google Secret Manager — document which env vars move from Netlify to GCP Secret Manager at migration time

### Quality & Reliability
- [ ] Error alerting — configure Sentry alert rules so critical errors page on-call
- [ ] Database backup verification — confirm Neon point-in-time recovery is enabled and test a restore

### Mobile API Foundation (Android / iOS)
- [ ] API token auth — issue long-lived JWT tokens for mobile clients (separate from web session cookies)
- [ ] Versioned API routes — `/api/v1/` prefix with dedicated mobile endpoints
- [ ] CORS policy — configure allowed origins in next.config.ts for mobile API consumers
- [ ] OpenAPI spec — document the mobile API (Swagger/OpenAPI 3) for app developers

### Support
- [ ] In-app support chat — add Crisp or Intercom once companies are paying

---

## Completed

### App Features
- [x] In-app dosing calculator — live recommendations on the visit form using existing chemistry engine
- [x] Required visit checklist — configurable items techs must confirm before logging a completed visit
- [x] Broadcast email — bulk message to all or filtered customers (price changes, weather closures, etc.)
- [x] Route optimization — auto-sort stops by shortest drive distance (nearest-neighbor, no API cost)
- [x] Calendar view — visual weekly/monthly calendar showing routes and scheduled visits
- [x] Technician assignment — assign specific techs to routes/visits; auto-fills on log visit form
- [x] Route profitability report — revenue per route, visits, $/visit, and assigned technician
- [x] In-app notification center — bell icon for overdue invoices, portal replies, chemical alerts; admin gets new company alerts

### Marketing & SEO
- [x] Add a demo / walkthrough video to the hero — admin sets YouTube/Vimeo URL via /admin/site-config
- [x] Add email capture / waitlist form — /waitlist page + landing page CTA; leads in /admin/waitlist
- [x] Create dedicated `/features` page — admin-managed feature cards via /admin/features
- [x] Referral program — referral codes + signup attribution via ?ref=CODE; managed in /admin/referrals
- [x] Start a blog — full CMS at /admin/blog; public /blog and /blog/[slug] pages
- [x] Connect Google Search Console — track impressions, clicks, and crawl errors after launch
- [x] Add a contact/support email (`hello@poolos.biz` — Google Workspace, live)

### Infrastructure
- [x] Health check endpoint — `/api/health` returns 200 + DB ping; required by Cloud Run load balancer
- [x] Dockerfile — multi-stage production build (node:22-slim, standalone Next.js output) for Cloud Run
- [x] GitHub Actions CI — lint, type-check, test, deploy to Cloud Run on push to main
- [x] Distributed rate limiting — migrated to Upstash Redis (sliding window); falls back to in-memory for local dev
- [x] Structured JSON logging — pino with GCP-compatible severity field; child loggers per module
- [x] Automated tests — auth, invoice creation, payment flow, and Stripe webhook (20 tests, Vitest)
