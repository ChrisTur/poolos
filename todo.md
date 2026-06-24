# PoolOS — Todo

## Competitor Feature Parity (ranked by priority)

- [x] In-app dosing calculator — live recommendations on the visit form using existing chemistry engine
- [x] Required visit checklist — configurable items techs must confirm before logging a completed visit
- [x] Broadcast email — bulk message to all or filtered customers (price changes, weather closures, etc.)
- [ ] Route optimization — auto-sort stops by shortest drive distance (nearest-neighbor, no API cost)
- [ ] QuickBooks Online integration — OAuth sync of invoices and payments
- [ ] Heritage Pool+ integration — nightly product catalog sync for expense logging; requires partner approval first (customersupport@heritagepoolplus.com)
- [ ] LaMotte Bluetooth integration — auto-fill chemical readings from device (Android PWA / Web Bluetooth)
- [ ] AI phone receptionist — inbound call handling add-on ($99/mo, Bland AI / Vapi)
- [ ] Consumer financing — Sunbit or similar payment plan option on invoices

## Marketing & SEO

- [ ] Create dedicated `/features` page — more pages = more keyword targets; right now everything is one long scroll
- [ ] Add email capture / waitlist form — someone not ready to sign up today needs a way to stay connected
- [ ] Add a demo / walkthrough video to the hero — the single highest-converting element a SaaS landing page can have
- [ ] Referral program — "Refer a company, get a free month"; pool owners know pool owners
- [ ] Start a blog — content like "How to price pool service routes" and "Pool chemical dosing guide" drives organic traffic
- [x] Connect Google Search Console — track impressions, clicks, and crawl errors after launch
- [ ] Add a contact/support email (`hello@poolos.biz` referenced in FAQ but not set up)

## Product

### Activation & Retention
- [ ] Data export — let companies download all their data (GDPR requirement)
- [ ] In-app notification center — bell icon for overdue invoices, portal replies, chemical alerts

### Scheduling & Field
- [ ] Calendar view — visual weekly/monthly calendar showing routes and scheduled visits
- [ ] Technician assignment — assign specific techs to routes/visits
- [ ] Mobile PWA — installable on homescreen with offline visit-log drafting

### Invoicing & Estimates
- [ ] Auto-invoicing — generate monthly invoices automatically for customers with a `monthlyRate` (cron job)
- [ ] Digital signatures on estimates — customers sign online via the customer portal
- [x] Bulk operations — select multiple customers to send a message, generate invoices, or apply a tag

### Customer Communication
- [ ] SMS notifications — Twilio integration for visit / en-route alerts

### Reporting & Data
- [ ] Chemical trend alerts — flag customers whose readings are consistently out of range
- [ ] Route profitability report — revenue per route vs time/fuel estimate

### Equipment
- [ ] Equipment maintenance log — `EquipmentService` records (date, work done, parts used)

## Infrastructure & Operations

- [ ] In-app support chat — add Crisp or Intercom once companies are paying
- [ ] Automated tests — at minimum cover invoice creation, payment, and auth flows
