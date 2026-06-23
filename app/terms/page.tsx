import type { Metadata } from "next"
import Link from "next/link"
import { Waves } from "lucide-react"

const BASE           = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"
const EFFECTIVE_DATE = "June 23, 2026"
const CONTACT_EMAIL  = "hello@poolos.biz"
const BILLING_EMAIL  = "billing@poolos.biz"

export const metadata: Metadata = {
  title: "Terms of Service — PoolOS",
  description: "Terms and conditions governing use of the PoolOS pool service management platform.",
  alternates: { canonical: `${BASE}/terms` },
}

export default function TermsPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">

          <section>
            <p>
              These Terms of Service ("<strong>Terms</strong>") govern your access to and use of the PoolOS
              website at poolos.biz and the PoolOS pool service management platform (collectively, the
              "<strong>Service</strong>") provided by PoolOS ("<strong>we</strong>", "<strong>us</strong>", or
              "<strong>our</strong>"). By creating an account or using the Service you agree to be bound by
              these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <Section title="1. Eligibility and Account Registration">
            <p>
              You must be at least 18 years old and authorized to enter into a binding contract to use the
              Service. The Service is intended for pool service businesses and their authorized staff — not
              for personal or consumer use.
            </p>
            <p>
              When you create an account you agree to provide accurate, current, and complete information.
              You are responsible for maintaining the confidentiality of your password and for all activity
              that occurs under your account. Notify us immediately at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a>{" "}
              if you suspect unauthorized access.
            </p>
            <p>
              You may not share your account credentials with persons outside your organization or create
              accounts on behalf of others without their authorization.
            </p>
          </Section>

          <Section title="2. The Service">
            <p>
              PoolOS provides cloud-based software for pool service companies, including tools for route
              scheduling, customer management, invoicing, chemical tracking, and customer communication.
              We reserve the right to modify, suspend, or discontinue any feature of the Service at any
              time with reasonable notice where practicable.
            </p>
            <p>
              Features available to you depend on your subscription plan. Plan details — including customer
              limits, staff account limits, and included features — are described on the pricing page at{" "}
              <Link href="/pricing" className="text-sky-600 hover:underline">poolos.biz/pricing</Link>.
            </p>
          </Section>

          <Section title="3. Free Trial">
            <p>
              New accounts receive a <strong>14-day free trial</strong> with access to core Service features.
              No payment method is required to start a trial. At the end of the trial period, continued
              access requires a paid subscription. We reserve the right to modify or discontinue the trial
              offer at any time.
            </p>
            <p>
              Trial accounts are subject to usage limits. We may terminate a trial account if we determine
              it is being used for purposes inconsistent with these Terms.
            </p>
          </Section>

          <Section title="4. Subscriptions and Billing">
            <SubSection title="Plans and pricing">
              <p>
                Paid plans are available on a monthly or annual basis. Current prices are published at{" "}
                <Link href="/pricing" className="text-sky-600 hover:underline">poolos.biz/pricing</Link>.
                We may change pricing with at least 30 days' notice to your account email address.
              </p>
            </SubSection>

            <SubSection title="Billing and payment">
              <p>
                All payments are processed by Stripe. By subscribing you authorize us to charge your
                payment method on a recurring basis for the plan you select. Subscriptions renew
                automatically at the end of each billing period unless cancelled before the renewal date.
              </p>
              <p>
                You are responsible for keeping your payment information current. If a charge fails, we will
                notify you by email and may suspend access to the Service until payment is resolved. Stripe
                may retry failed charges automatically.
              </p>
            </SubSection>

            <SubSection title="Refunds">
              <p>
                <strong>Monthly plans</strong> are non-refundable. If you cancel a monthly subscription
                your access continues through the end of the current billing period and does not renew.
              </p>
              <p>
                <strong>Annual plans</strong> may be eligible for a prorated refund of unused months at
                our discretion if cancelled within 30 days of the annual renewal date. To request a
                refund, contact{" "}
                <a href={`mailto:${BILLING_EMAIL}`} className="text-sky-600 hover:underline">{BILLING_EMAIL}</a>.
              </p>
              <p>
                We do not issue refunds for partial months, unused features, or plan downgrades.
              </p>
            </SubSection>

            <SubSection title="Taxes">
              <p>
                Subscription prices do not include taxes. You are responsible for all applicable sales,
                use, VAT, or similar taxes. Where required by law, we may collect and remit taxes on
                your behalf.
              </p>
            </SubSection>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable law, regulation, or third-party right.</li>
              <li>Upload, transmit, or distribute malicious code, spam, or any content that is unlawful, defamatory, or fraudulent.</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
              <li>Access the Service by automated means (scraping, bots) without our written permission.</li>
              <li>Resell, sublicense, or otherwise provide access to the Service to third parties not covered by your account.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service or its infrastructure.</li>
              <li>Impersonate another person or entity, or misrepresent your affiliation with any person or entity.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these restrictions without
              refund.
            </p>
          </Section>

          <Section title="6. Your Data and Content">
            <SubSection title="Ownership">
              <p>
                You retain full ownership of all data and content you upload or create through the Service,
                including your customer records, invoices, routes, and service notes ("<strong>Your Content</strong>").
                These Terms do not transfer ownership of Your Content to us.
              </p>
            </SubSection>

            <SubSection title="License to us">
              <p>
                You grant us a limited, non-exclusive license to store, process, and transmit Your Content
                solely to provide and improve the Service. We do not use Your Content for advertising,
                sell it to third parties, or access it except as necessary to operate the Service or
                respond to a support request you initiate.
              </p>
            </SubSection>

            <SubSection title="Your responsibilities">
              <p>
                You are responsible for the accuracy and legality of Your Content, including ensuring you
                have the right to store and process your customers' personal information within the Service.
                You are the data controller for your customers' data; we act as a data processor on your
                behalf as described in our{" "}
                <Link href="/privacy" className="text-sky-600 hover:underline">Privacy Policy</Link>.
              </p>
            </SubSection>

            <SubSection title="Data export and deletion">
              <p>
                You may export your data at any time through the Service. Upon account termination we
                retain Your Content for 90 days during which you may request an export. After 90 days
                Your Content is permanently deleted from our systems.
              </p>
            </SubSection>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The Service, including its software, design, text, graphics, and branding, is owned by
              PoolOS and protected by copyright, trademark, and other intellectual property laws. These
              Terms do not grant you any right, title, or interest in the Service beyond the limited
              license to use it as described here.
            </p>
            <p>
              If you provide feedback, suggestions, or ideas about the Service, you grant us a perpetual,
              irrevocable, royalty-free license to use that feedback without obligation to you.
            </p>
          </Section>

          <Section title="8. Third-Party Services">
            <p>
              The Service integrates with third-party platforms including Stripe (payment processing),
              Resend (email delivery), and Google (analytics). Your use of those platforms is governed
              by their respective terms and privacy policies. We are not responsible for the practices
              of third-party providers.
            </p>
            <p>
              The Service may also send emails on your behalf to your customers (invoices, visit summaries,
              etc.). You are responsible for ensuring those communications comply with applicable email laws
              (CAN-SPAM, CASL) and that your customers have consented to receive them.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p className="uppercase text-sm font-medium text-gray-700">
              The service is provided "as is" and "as available" without warranties of any kind, either
              express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, title, and non-infringement.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, error-free, or free of viruses
              or other harmful components. We do not warrant the accuracy or completeness of any
              information provided through the Service. You use the Service at your own risk.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p className="uppercase text-sm font-medium text-gray-700">
              To the maximum extent permitted by applicable law, PoolOS and its officers, employees,
              agents, and licensors will not be liable for any indirect, incidental, special,
              consequential, or punitive damages — including loss of profits, data, customers, goodwill,
              or business interruption — arising out of or related to your use of or inability to use
              the service, even if advised of the possibility of such damages.
            </p>
            <p>
              Our total liability to you for any claim arising out of or related to these Terms or the
              Service will not exceed the greater of (a) the amount you paid us in the 12 months
              preceding the claim or (b) one hundred US dollars ($100).
            </p>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages. In those
              jurisdictions our liability is limited to the maximum extent permitted by law.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to defend, indemnify, and hold harmless PoolOS and its officers, employees, and
              agents from and against any claims, damages, losses, liabilities, costs, and expenses
              (including reasonable attorneys' fees) arising out of or related to: (a) your use of the
              Service; (b) Your Content; (c) your violation of these Terms; or (d) your violation of any
              third-party right, including privacy or intellectual property rights.
            </p>
          </Section>

          <Section title="12. Termination">
            <SubSection title="By you">
              <p>
                You may cancel your subscription at any time through the billing settings in your account
                or by contacting{" "}
                <a href={`mailto:${BILLING_EMAIL}`} className="text-sky-600 hover:underline">{BILLING_EMAIL}</a>.
                Cancellation takes effect at the end of the current billing period.
              </p>
            </SubSection>

            <SubSection title="By us">
              <p>
                We may suspend or terminate your account immediately if you violate these Terms, if your
                payment is overdue after reasonable notice, or if we are required to do so by law. We may
                also terminate the Service entirely with 30 days' notice.
              </p>
              <p>
                Upon termination, your right to access the Service ends. We will retain Your Content for
                90 days as described in Section 6. Provisions of these Terms that by their nature should
                survive termination will survive, including Sections 6, 7, 9, 10, 11, and 13.
              </p>
            </SubSection>
          </Section>

          <Section title="13. Governing Law and Disputes">
            <p>
              These Terms are governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles.
            </p>
            <p>
              Before initiating any formal dispute, you agree to contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a>{" "}
              and give us 30 days to attempt to resolve the issue informally.
            </p>
            <p>
              Any dispute that cannot be resolved informally will be settled by binding arbitration
              administered under the American Arbitration Association's Consumer Arbitration Rules. The
              arbitration will be conducted in English. You waive any right to a jury trial or to
              participate in a class action lawsuit or class-wide arbitration.
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We may update these Terms from time to time. When we make material changes we will notify
              you by updating the effective date at the top of this page and sending an email to your
              account address at least 14 days before the changes take effect. Your continued use of
              the Service after that date constitutes acceptance of the updated Terms.
            </p>
            <p>
              If you do not agree to the updated Terms, you may cancel your account before the effective
              date and receive a prorated refund of any prepaid annual subscription fees for unused months.
            </p>
          </Section>

          <Section title="15. Miscellaneous">
            <ul>
              <li><strong>Entire agreement.</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and PoolOS regarding the Service and supersede all prior agreements.</li>
              <li><strong>Severability.</strong> If any provision of these Terms is held invalid or unenforceable, the remaining provisions remain in full force and effect.</li>
              <li><strong>No waiver.</strong> Our failure to enforce any right or provision is not a waiver of that right.</li>
              <li><strong>Assignment.</strong> You may not assign your rights under these Terms without our consent. We may assign our rights in connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>Force majeure.</strong> We are not liable for delays or failures in performance caused by circumstances beyond our reasonable control.</li>
            </ul>
          </Section>

          <Section title="16. Contact Us">
            <p>Questions about these Terms? Contact us:</p>
            <address className="not-italic leading-relaxed">
              <strong className="text-gray-900">PoolOS</strong><br />
              General: <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a><br />
              Billing: <a href={`mailto:${BILLING_EMAIL}`} className="text-sky-600 hover:underline">{BILLING_EMAIL}</a><br />
              Website: <a href={BASE} className="text-sky-600 hover:underline">poolos.biz</a>
            </address>
          </Section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} PoolOS. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/"        className="hover:text-gray-600">Home</Link>
          <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="/login"   className="hover:text-gray-600">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed">
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
