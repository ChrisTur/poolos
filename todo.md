# PoolOS — Todo

## Marketing & SEO

- [ ] Create dedicated `/features` page — more pages = more keyword targets; right now everything is one long scroll
- [ ] Create dedicated `/pricing` page — separate page for pricing-intent searches ("pool service software pricing")
- [x] Add Google Analytics (or Plausible) to the marketing site — can't improve what you can't measure
- [ ] Add email capture / waitlist form — someone not ready to sign up today needs a way to stay connected
- [ ] Add a demo / walkthrough video to the hero — the single highest-converting element a SaaS landing page can have
- [ ] Referral program — "Refer a company, get a free month"; pool owners know pool owners
- [ ] Start a blog — content like "How to price pool service routes" and "Pool chemical dosing guide" drives organic traffic
- [ ] Connect Google Search Console — track impressions, clicks, and crawl errors after launch
- [ ] Register a custom domain — `poolos.biz` subdomains rank worse than a root domain (e.g. `poolos.biz`)
- [ ] Add Privacy Policy and Terms of Service pages — currently placeholders in the footer
- [ ] Add a contact/support email (`hello@poolos.biz` referenced in FAQ but not set up)
- [ ] Water chemistry calculator page — free tool (dosing by pool size + current readings) that drives SEO and is genuinely useful to pool techs

## Billing / Monetization

- [ ] Add remaining Stripe billing fields to Company schema — `stripePlatformCustId`, `stripeSubId`, `stripeSubStatus`
- [ ] Create Stripe Billing products and prices for Starter / Pro / Unlimited tiers
- [ ] Build billing page in company Settings — shows current plan, upgrade/downgrade, invoice history
- [ ] Add Stripe webhook handler for `customer.subscription.*` events to sync `stripeSubStatus`
- [ ] Add plan enforcement middleware — gate features or block access when trial expires or subscription is past_due
- [ ] Add trial expiry banner inside the app — "Your trial ends in X days — upgrade to keep access"
- [x] Annual billing option — offer 2 months free (≈17% discount) for annual payment; increases LTV and reduces churn
- [ ] Coupon / promo codes via Stripe — needed for partnerships, support credits, and early-adopter deals
- [ ] Dunning / failed payment recovery — automated emails when a charge fails; silently kills MRR without this
- [ ] Admin panel: show plan + MRR per company

## Product

### Activation & Retention
- [x] Customer onboarding checklist — guide new companies through first customer, first route, and first invoice; biggest driver of early churn reduction
- [ ] CSV customer import — companies switching from spreadsheets need to bring their existing list in without manual entry
- [ ] Data export — let companies download all their data; builds trust, prevents vendor lock-in fear, and is a GDPR requirement
- [ ] In-app notification center — bell icon for overdue invoices, new portal replies, and chemical alerts; currently everything only goes to email

### Scheduling & Field
- [ ] Calendar view — visual weekly/monthly calendar showing routes and scheduled visits
- [ ] Route optimizer — auto-suggest stop order based on address proximity (Google Maps API)
- [ ] Technician assignment — assign specific techs to routes/visits; currently visits aren't tied to a user
- [ ] Mobile PWA — installable on homescreen with offline visit-log drafting for techs in the field

### Invoicing & Estimates
- [ ] Auto-invoicing — generate monthly invoices automatically for customers with a `monthlyRate` set (cron job)
- [ ] Digital signatures on estimates — customers sign estimates online via the customer portal; closes jobs faster
- [ ] Bulk operations — select multiple customers to send a message, generate invoices, or apply a tag

### Customer Communication
- [ ] SMS notifications — Twilio integration so customers get a text when a tech is en route or service is complete

### Reporting & Data
- [ ] QuickBooks / Xero export — formatted CSV or direct integration for accounting sync
- [ ] Chemical trend alerts — flag customers whose readings are consistently out of range across multiple visits
- [ ] Route profitability report — revenue per route vs time/fuel estimate

### Equipment
- [ ] Equipment maintenance log — add `EquipmentService` records (date, work done, parts used) to the existing Equipment model

## Infrastructure & Operations

- [ ] Error monitoring — add Sentry (or similar) so you know when production breaks before customers tell you
- [ ] Email deliverability setup — configure SPF, DKIM, and a custom sending domain in Resend so emails don't hit spam
- [ ] In-app support chat — add Crisp or Intercom once companies are paying; email support doesn't scale
- [ ] Automated tests — at minimum, test the invoice creation, payment, and auth flows
- [ ] Rate limiting on API routes — prevent abuse on public-facing endpoints (`/api/auth`, `/pay/`, `/portal/`)
