# PoolOS — Todo

> ⚡ = competitive gap vs. PoolBrain

---

## Implement Now

*Web features, no infrastructure blockers, ranked by impact.*

### Competitive Parity — Core Operations
- [ ] ⚡ Issue reports — techs flag problems mid-visit (leak, equipment failure, safety hazard) with category, notes, and photos; visible to all staff and linked to the visit record
- [ ] ⚡ Customer feedback — one-click satisfaction rating in the proof-of-service email; low scores trigger a staff alert before the customer can post a public review
- [ ] ⚡ Job templates — one-click pre-built workflows for pool opening, closing, filter clean, acid wash, pump prime; reduces setup time for common jobs
- [ ] ⚡ Chemical cost & usage tracking — log chemicals added + quantity per visit; cost analytics by customer, technician, and company-wide; spend vs. revenue widget on reports
- [ ] ⚡ Estimate approval workflow — customers approve or deny estimates from the portal; approved estimates auto-convert to a scheduled job; denial prompts a reply thread
- [ ] Digital signatures on estimates — customer signs the approved estimate online via the portal
- [ ] ⚡ Multiple bodies of water — track pool + spa + water feature separately per customer; each with its own readings, pricing, workflow, and chemical history

### Competitive Parity — Analytics & Management
- [ ] ⚡ Technician scorecards — per-tech dashboard: visits completed, avg chemical spend per stop, customer satisfaction scores, open alert trends
- [ ] ⚡ Drag-and-drop route scheduling — rearrange stops within a route and move stops between routes/days via drag-and-drop; unscheduled queue for pending jobs
- [ ] ⚡ Interactive report charts — clickable bars and data points on all report charts that drill down to the underlying invoices, visits, or customers
- [ ] Chemical trend alerts — flag customers whose readings have been consistently out of range across 3+ visits

### Payments & Billing
- [ ] ⚡ ACH / bank transfer payments — Stripe ACH option on invoices and the customer portal; lower fees than card; daily retry logic on declines
- [ ] ⚡ Technician payroll calculations — automated pay based on jobs completed; configurable rates per employee, property, body of water, and service type

### Compliance & Reliability
- [ ] Data export — companies can download all their data as CSV/ZIP (GDPR requirement)
- [ ] Sentry error alerting — configure alert rules so critical errors page on-call (already integrated, just needs rules)

### Integrations (External Services — No GCP Dependency)
- [ ] QuickBooks Online — two-way sync of customers, invoices, payments, refunds, and service categories; needs QBO developer account
- [ ] SMS notifications — Twilio integration for visit reminders and alerts; start A2P 10DLC carrier registration now (takes 2–4 weeks)

### Support
- [ ] In-app support chat — add Crisp or Intercom once companies are paying

---

## Once on Google Cloud

*These are blocked on or significantly better with GCP infrastructure.*

- [ ] Auto-invoicing — generate monthly invoices for all customers with a `monthlyRate` on a cron schedule (requires GCP Cloud Scheduler)
- [ ] Google Secret Manager — migrate all env vars from Netlify dashboard to Secret Manager; document the mapping before cutover
- [ ] Database backup verification — confirm Neon point-in-time recovery is enabled and run a test restore

---

## Requires a Native App

*Web / PWA cannot fully deliver these — defer until iOS/Android app exists.*

- [ ] Offline operation — full offline visit logging with auto-sync on reconnect (PoolBrain's biggest differentiator in the field)
- [ ] Push notifications — real-time alerts to techs' phones for schedule changes, new jobs, and issue escalations
- [ ] API token auth — long-lived JWT tokens for mobile clients (separate from web session cookies)
- [ ] Versioned API routes — `/api/v1/` prefix with dedicated mobile endpoints
- [ ] CORS policy — configure allowed origins in next.config.ts for mobile API consumers
- [ ] OpenAPI spec — document the mobile API (Swagger/OpenAPI 3) for app developers
- [ ] LaMotte Bluetooth integration — auto-fill chemical readings from Bluetooth device (Web Bluetooth API is too unreliable without a native wrapper)

---

## Hold (Partner Approval / Premature)

- [ ] Heritage Pool+ integration — nightly product catalog sync; requires partner approval (customersupport@heritagepoolplus.com)
- [ ] AI phone receptionist — inbound call handling add-on ($99/mo, Bland AI / Vapi)
- [ ] Consumer financing — Sunbit or similar payment plan option on invoices

---

## Marketing & SEO

- [ ] Google Search Console — verify domain and monitor impressions, clicks, and crawl errors

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
- [x] Equipment lifecycle management — registry (pump/filter/heater/salt cell/etc. with model, serial, install date, warranty); service history per piece (date, work, parts, cost, technician); auto-scheduling via configurable service interval with overdue badges + notification bell alerts
- [x] Admin revenue dashboard — /admin/companies now shows KPI summary (total customers, customer MRR, platform MRR, Stripe 30d volume), plan breakdown by tier, and per-company columns for customer count, customer MRR, Stripe 30d, and subscription status

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
