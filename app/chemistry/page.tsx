import type { Metadata } from "next"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import Calculator from "./Calculator"

export const metadata: Metadata = {
  title:       "Pool Water Chemistry Calculator — Free Dosing Guide",
  description: "Free pool chemical dosing calculator. Enter your pool size and test readings to get exact amounts of chlorine, pH adjusters, alkalinity, calcium, and stabilizer to add.",
  openGraph: {
    title:       "Pool Water Chemistry Calculator",
    description: "Enter your pool's readings and get exact chemical dosing instructions — free.",
  },
}

const PARAMS = [
  { name: "Free Chlorine",            range: "1–3 ppm",          ideal: "1.5–2 ppm",    purpose: "Sanitizes the water and kills bacteria, algae, and pathogens." },
  { name: "pH",                       range: "7.2–7.6",          ideal: "7.4",           purpose: "Controls how effective chlorine is and prevents equipment corrosion and swimmer discomfort." },
  { name: "Total Alkalinity",         range: "80–120 ppm",       ideal: "100 ppm",       purpose: "Stabilizes pH so it doesn't swing up and down between service visits." },
  { name: "Calcium Hardness",         range: "200–400 ppm",      ideal: "250–300 ppm",   purpose: "Prevents water from etching plaster or depositing scale on surfaces and equipment." },
  { name: "Cyanuric Acid (CYA)",      range: "30–50 ppm",        ideal: "40 ppm",        purpose: "Protects chlorine from UV degradation in outdoor pools. Not needed for indoor pools." },
  { name: "Salt (saltwater pools)",   range: "2,700–3,400 ppm",  ideal: "3,200 ppm",     purpose: "Feeds the salt chlorine generator to produce chlorine continuously." },
]

export default function ChemistryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-4">
              Free tool
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Pool Water Chemistry Calculator
            </h1>
            <p className="mt-4 text-gray-500 text-lg leading-relaxed">
              Enter your pool size and current test readings. Get exact chemical dosing
              instructions to bring every parameter into balance.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Calculator />
        </section>

        {/* Reference table */}
        <section className="bg-white border-t border-gray-100 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pool chemistry target ranges</h2>
            <p className="text-gray-500 text-sm mb-8">
              Keep all six parameters in balance. Correcting one often affects the others — always
              address alkalinity before pH, and pH before chlorine.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-700">Parameter</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-700">Target range</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-700">Ideal</th>
                    <th className="text-left py-3 font-semibold text-gray-700">Why it matters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PARAMS.map((p) => (
                    <tr key={p.name}>
                      <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                      <td className="py-3 pr-4 font-mono text-gray-700">{p.range}</td>
                      <td className="py-3 pr-4 font-mono text-sky-700 whitespace-nowrap">{p.ideal}</td>
                      <td className="py-3 text-gray-500 leading-relaxed">{p.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Tips section */}
        <section className="py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Chemical safety tips</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Add one chemical at a time",    body: "Wait 4–6 hours (one full pump cycle) between additions so you can accurately measure the effect before adding more." },
                { title: "Never mix chemicals",           body: "Adding two chemicals to the same bucket or skimmer — even sequentially — can cause dangerous reactions. Always use separate locations." },
                { title: "Add chemicals to water",        body: "Pre-dilute chemicals by adding them to a bucket of water, not the other way around. This prevents splashing and hot spots." },
                { title: "Test at the right time",        body: "Test water after the pump has run for at least 1 hour for an accurate reading. Mid-afternoon gives the most consistent results." },
                { title: "Adjust alkalinity first",       body: "TA is the buffer that holds pH steady. Correct it first — pH often corrects itself afterward, saving chemicals." },
                { title: "Wear protective gear",          body: "Always wear chemical-resistant gloves and eye protection when handling pool chemicals, especially muriatic acid." },
              ].map((tip) => (
                <div key={tip.title} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{tip.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border-t border-gray-100 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently asked questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "How accurate are the dosing amounts?",
                  a: "Amounts are based on standard industry formulas and typical product concentrations. Real-world results vary with water temperature, circulation, and product brand — always start with a little less than recommended and retest before adding more.",
                },
                {
                  q: "In what order should I add chemicals?",
                  a: "The correct order is: (1) alkalinity, (2) pH, (3) calcium hardness, (4) chlorine/sanitizer, (5) cyanuric acid, (6) salt. Wait a full pump cycle between each step.",
                },
                {
                  q: "My chlorine is fine but the pool is still green. Why?",
                  a: "Algae can survive when CYA is too high (\"chlorine lock\"), pH is too far out of range, or the free chlorine reading is falsely elevated by combined chlorines. Shock the pool to breakpoint chlorination and test CYA.",
                },
                {
                  q: "How often should I test my pool water?",
                  a: "Test free chlorine and pH at least twice per week. Test total alkalinity and calcium hardness once per month. Test CYA every 2–3 months or whenever water is replaced.",
                },
              ].map((faq) => (
                <div key={faq.q} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
