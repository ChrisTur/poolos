# PoolOS — Todo

## Marketing & SEO

- [ ] Create dedicated `/features` page — more pages = more keyword targets; right now everything is one long scroll
- [ ] Create dedicated `/pricing` page — separate page for pricing-intent searches ("pool service software pricing")
- [ ] Start a blog — content like "How to price pool service routes" and "Pool chemical dosing guide" drives organic traffic from pool company owners
- [ ] Connect Google Search Console — track impressions, clicks, and crawl errors after launch
- [ ] Register a custom domain — `poolos.netlify.app` subdomains rank worse than a root domain (e.g. `poolos.app`)
- [ ] Add Privacy Policy and Terms of Service pages — currently placeholders in the footer
- [ ] Add a contact/support email (`hello@poolos.app` referenced in FAQ but not set up)

## Billing / Monetization

- [ ] Add subscription fields to Company schema — `plan`, `trialEndsAt`, `stripePlatformCustId`, `stripeSubId`, `stripeSubStatus`
- [ ] Create Stripe Billing products and prices for Starter / Pro / Unlimited tiers
- [ ] Build billing page in company Settings — shows current plan, upgrade/downgrade, invoice history
- [ ] Add Stripe webhook handler for `customer.subscription.*` events to sync `stripeSubStatus`
- [ ] Add plan enforcement middleware — gate features or block access when trial expires or subscription is past_due
- [ ] Add trial expiry banner inside the app — "Your trial ends in X days — upgrade to keep access"
- [ ] Admin panel: show plan + MRR per company

## Product

- [ ] Calendar view — visual weekly/monthly calendar showing routes and scheduled visits
- [ ] Auto-invoicing — generate monthly invoices automatically for customers with a `monthlyRate` set (cron job)
- [ ] SMS notifications — Twilio integration so customers get a text when a tech is en route or service is complete
- [ ] Technician assignment — assign specific techs to routes/visits; currently visits aren't tied to a user
- [ ] Equipment maintenance log — add `EquipmentService` records (date, work done, parts used) to the existing Equipment model
- [ ] Chemical trend alerts — flag customers whose readings are consistently out of range across multiple visits
- [ ] QuickBooks / Xero export — formatted CSV or direct integration for accounting sync
- [ ] Bulk operations — select multiple customers to send a message, generate invoices, or apply a tag
- [ ] GCS CORS setup — run `gcloud storage buckets update gs://poolos-uploads --cors-file=cors.json` in Cloud Shell so photo uploads work in production
- [ ] Add Netlify env vars for GCS — `GCS_SERVICE_ACCOUNT_KEY`, `GCS_BUCKET`, `GCS_PUBLIC_URL`, `NEXT_PUBLIC_GCS_PUBLIC_URL`
