import type { Metadata } from "next"
import Link from "next/link"
import { Waves } from "lucide-react"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"
const EFFECTIVE_DATE = "June 23, 2026"
const CONTACT_EMAIL  = "hello@poolos.biz"

export const metadata: Metadata = {
  title: "Privacy Policy — PoolOS",
  description: "How PoolOS collects, uses, and protects your information.",
  alternates: { canonical: `${BASE}/privacy` },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sky-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">PoolOS</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-gray prose-sm sm:prose max-w-none space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              PoolOS ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates the
              website poolos.biz and the PoolOS pool service management platform (the "<strong>Service</strong>").
              This Privacy Policy explains what information we collect, how we use it, and the choices you have.
              By using the Service you agree to the practices described here.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <SubSection title="a. Information you provide directly">
              <ul>
                <li><strong>Account information</strong> — name, email address, and password when you register.</li>
                <li><strong>Company profile</strong> — business name, address, phone number, and logo you add to your account.</li>
                <li><strong>Customer data</strong> — names, addresses, email addresses, and pool service records you enter for your own customers. You control this data; we process it on your behalf.</li>
                <li><strong>Billing information</strong> — when you subscribe to a paid plan, payment is processed by Stripe. We do not store your card number, expiry, or CVV. We retain only a Stripe Customer ID and subscription status.</li>
                <li><strong>Communications</strong> — messages you send to us by email or through support channels.</li>
              </ul>
            </SubSection>

            <SubSection title="b. Information collected automatically">
              <ul>
                <li><strong>Usage data</strong> — pages visited, features used, and actions taken within the Service (e.g., invoices created, routes saved).</li>
                <li><strong>Device and log data</strong> — IP address, browser type, operating system, referring URL, and timestamps recorded in server logs.</li>
                <li><strong>Cookies and similar technologies</strong> — session cookies required for authentication, and analytics cookies described in Section 5.</li>
              </ul>
            </SubSection>

            <SubSection title="c. Information from third parties">
              <ul>
                <li><strong>Stripe</strong> — we receive confirmation of subscription status, payment success or failure, and your Stripe Customer ID after you complete checkout.</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account and company profile.</li>
              <li>Provide, maintain, and improve the Service — including invoicing, route scheduling, chemical tracking, and customer communication features.</li>
              <li>Process subscription payments and send billing receipts through Stripe.</li>
              <li>Send transactional emails — invoice notifications, visit summaries, payment reminders, and account alerts — through Resend.</li>
              <li>Respond to your support requests and communicate with you about your account.</li>
              <li>Monitor usage patterns to fix bugs, improve performance, and develop new features.</li>
              <li>Detect and prevent fraud, abuse, or security incidents.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal information or the personal information of your customers
              to third parties. We do not use your data for advertising.
            </p>
          </Section>

          <Section title="3. How We Share Your Information">
            <p>
              We share information only with the service providers necessary to operate the Service. Each
              provider is contractually required to protect your data and use it only for the services they
              perform for us.
            </p>

            <SubSection title="Service providers we use">
              <ul>
                <li>
                  <strong>Stripe</strong> (stripe.com) — payment processing and subscription billing.
                  Stripe is PCI-DSS Level 1 certified. Your card data goes directly to Stripe and never
                  passes through our servers.{" "}
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                    Stripe Privacy Policy
                  </a>.
                </li>
                <li>
                  <strong>Resend</strong> (resend.com) — transactional email delivery (invoices, visit
                  notifications, account emails). Emails sent from billing@poolos.biz pass through Resend's
                  infrastructure.
                </li>
                <li>
                  <strong>Netlify</strong> (netlify.com) — web hosting and serverless compute. Your data
                  is stored in databases hosted on Netlify's infrastructure.
                </li>
                <li>
                  <strong>Google Analytics</strong> — aggregate, anonymized website analytics (pages
                  visited, session counts). We have enabled IP anonymization. Google may use this data
                  per their own privacy policy.{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                    Google Privacy Policy
                  </a>.
                </li>
              </ul>
            </SubSection>

            <p>
              We may also disclose information if required by law, court order, or government authority,
              or to protect the rights, property, or safety of PoolOS, our users, or the public.
            </p>
          </Section>

          <Section title="4. Your Customer Data">
            <p>
              When you use PoolOS to manage your pool service business, you enter data about your own
              customers (names, addresses, email addresses, service records). You are the <strong>data
              controller</strong> for this information; we are a <strong>data processor</strong> acting
              on your instructions.
            </p>
            <p>
              We process your customers' data only to provide the Service to you. We do not use it for
              our own purposes, sell it, or share it with third parties beyond the service providers
              listed above. You are responsible for obtaining any necessary consent from your customers
              to store and use their information within the Service.
            </p>
            <p>
              If you cancel your account and request data deletion, we will permanently delete your
              customer data within 30 days.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>We use the following types of cookies:</p>
            <ul>
              <li>
                <strong>Strictly necessary cookies</strong> — session tokens required for authentication.
                The Service cannot function without these. No consent is required.
              </li>
              <li>
                <strong>Functional cookies</strong> — small preference values (e.g., dismissed onboarding
                checklist, dismissed promotional banners) stored to improve your experience.
              </li>
              <li>
                <strong>Analytics cookies</strong> — Google Analytics uses cookies to measure how visitors
                use our marketing pages. Data is aggregated and anonymized. You can opt out by installing
                the{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                  Google Analytics Opt-out Browser Add-on
                </a>.
              </li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <ul>
              <li><strong>Active accounts</strong> — we retain your data for as long as your account is active.</li>
              <li><strong>Cancelled accounts</strong> — data is retained for 90 days after cancellation, then permanently deleted. You may request immediate deletion at any time.</li>
              <li><strong>Billing records</strong> — transaction history required for tax and accounting purposes is retained for 7 years in accordance with standard financial record-keeping requirements.</li>
              <li><strong>Server logs</strong> — retained for up to 90 days for security and debugging purposes.</li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p>
              Depending on where you are located, you may have the following rights regarding your
              personal information:
            </p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal information we hold about you.</li>
              <li><strong>Correction</strong> — update or correct inaccurate information. Most account data can be edited directly in your settings.</li>
              <li><strong>Deletion</strong> — request that we delete your account and associated data.</li>
              <li><strong>Portability</strong> — request your data in a machine-readable format.</li>
              <li><strong>Restriction / Objection</strong> — object to or request that we limit certain processing activities.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a>.
              We will respond within 30 days. We may ask you to verify your identity before fulfilling the request.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We use industry-standard security measures to protect your information, including:
            </p>
            <ul>
              <li>TLS/HTTPS encryption for all data in transit.</li>
              <li>Encrypted passwords (bcrypt hashing — your plaintext password is never stored).</li>
              <li>Database access restricted to authenticated application infrastructure.</li>
              <li>Payment card data handled entirely by Stripe, which is PCI-DSS Level 1 certified.</li>
            </ul>
            <p>
              No system is 100% secure. If you believe your account has been compromised, please contact
              us immediately at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              PoolOS is a business-to-business service intended for adults operating pool service
              companies. We do not knowingly collect personal information from anyone under 18. If you
              believe a minor has provided us with personal information, please contact us and we will
              delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we
              will notify you by updating the effective date at the top of this page and, where
              appropriate, sending an email to the address on your account. Your continued use of the
              Service after the changes take effect constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have questions, concerns, or requests related to this Privacy Policy, please contact
              us:
            </p>
            <address className="not-italic text-gray-600 leading-relaxed">
              <strong className="text-gray-900">PoolOS</strong><br />
              Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a><br />
              Website: <a href={BASE} className="text-sky-600 hover:underline">poolos.biz</a>
            </address>
          </Section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} PoolOS. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/"       className="hover:text-gray-600">Home</Link>
          <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
          <Link href="/login"  className="hover:text-gray-600">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  )
}
