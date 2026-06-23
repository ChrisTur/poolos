# PoolOS — Todo

## Marketing & SEO

- [ ] Create dedicated `/features` page — more pages = more keyword targets; right now everything is one long scroll
- [x] Create dedicated `/pricing` page — separate page for pricing-intent searches ("pool service software pricing")
- [x] Add Google Analytics (G-9DHZQXE2YH) to the marketing site
- [ ] Add email capture / waitlist form — someone not ready to sign up today needs a way to stay connected
- [ ] Add a demo / walkthrough video to the hero — the single highest-converting element a SaaS landing page can have
- [ ] Referral program — "Refer a company, get a free month"; pool owners know pool owners
- [ ] Start a blog — content like "How to price pool service routes" and "Pool chemical dosing guide" drives organic traffic
- [ ] Connect Google Search Console — track impressions, clicks, and crawl errors after launch
- [x] Add Privacy Policy and Terms of Service pages — /privacy and /terms, linked from all footers
- [ ] Add a contact/support email (`hello@poolos.biz` referenced in FAQ but not set up)
- [ ] Water chemistry calculator page — free tool (dosing by pool size + current readings) that drives SEO and is genuinely useful to pool techs

## Billing / Monetization

- [x] Add remaining Stripe billing fields to Company schema — `stripePlatformCustId`, `stripeSubId`, `stripeSubStatus`
- [x] Create Stripe Billing products and prices for Starter / Pro / Unlimited tiers
- [x] Build billing page in company Settings — shows current plan, upgrade/downgrade, invoice history
- [x] Add Stripe webhook handler for `customer.subscription.*` events to sync `stripeSubStatus`
- [x] Add plan enforcement / PlanGate — blocks access when trial expires or subscription is past_due
- [x] Trial expiry banner — "Your trial ends in X days — upgrade to keep access"
- [x] Trial upgrade CTAs — sidebar block + dashboard card for all trial users
- [x] Annual billing option — offer 2 months free (≈17% discount); toggle on checkout and billing page
- [x] Coupon / promo codes — `allow_promotion_codes: true` on Stripe checkout; manage codes in Stripe dashboard
- [x] Dunning / failed payment recovery — dunning email sent on `invoice.payment_failed` with retry-aware subject
- [x] Admin panel: MRR stat, plan per company, view-as
- [x] Admin plan editor — DB-backed plan config with feature toggles, prices, limits, highlights
- [x] Dynamic promo banners — admin CRUD, shown on marketing pages + in-app for trial users

## Product

### Activation & Retention
- [x] Customer onboarding checklist — guides new companies through first customer, route, and invoice
- [ ] CSV customer import — companies switching from spreadsheets need bulk import
- [ ] Data export — let companies download all their data (GDPR requirement)
- [ ] In-app notification center — bell icon for overdue invoices, portal replies, chemical alerts

### Scheduling & Field
- [ ] Calendar view — visual weekly/monthly calendar showing routes and scheduled visits
- [ ] Route optimizer — auto-suggest stop order based on address proximity (Google Maps API)
- [ ] Technician assignment — assign specific techs to routes/visits
- [ ] Mobile PWA — installable on homescreen with offline visit-log drafting

### Invoicing & Estimates
- [ ] Auto-invoicing — generate monthly invoices automatically for customers with a `monthlyRate` (cron job)
- [ ] Digital signatures on estimates — customers sign online via the customer portal
- [ ] Bulk operations — select multiple customers to send a message, generate invoices, or apply a tag

### Customer Communication
- [ ] SMS notifications — Twilio integration for visit / en-route alerts

### Reporting & Data
- [ ] QuickBooks / Xero export — formatted CSV or direct integration
- [ ] Chemical trend alerts — flag customers whose readings are consistently out of range
- [ ] Route profitability report — revenue per route vs time/fuel estimate

### Equipment
- [ ] Equipment maintenance log — `EquipmentService` records (date, work done, parts used)

## Infrastructure & Operations

- [x] Error monitoring — Sentry wired up (client + server + edge); NEXT_PUBLIC_SENTRY_DSN set in Netlify
- [x] Email deliverability — SPF, DKIM, DMARC configured in Netlify DNS; domain verified in Resend
- [x] Custom 404 and 500 pages — branded not-found.tsx, error.tsx, global-error.tsx
- [x] sitemap.xml — app/sitemap.ts covers /, /pricing, /register, /login, /privacy, /terms
- [x] robots.txt — app/robots.ts blocks /admin, /api/, /pay/, /portal/ and app routes
- [x] Stripe trial sync — checkout passes trial_period_days = remaining days when company is still in app-level trial
- [x] Resend "Enable Sending" — confirmed active in Resend dashboard
- [x] Stripe Customer Portal configured — payment update, invoice history, cancel at period end; return URL set to /settings/billing
- [ ] In-app support chat — add Crisp or Intercom once companies are paying
- [x] Cookie consent — banner on first visit, GA only loads after acceptance, choice persisted in localStorage
- [ ] Automated tests — at minimum cover invoice creation, payment, and auth flows
- [x] Rate limiting on API routes — sliding-window per-IP in middleware; covers /api/auth, /register, /forgot-password, /pay/, /portal/
