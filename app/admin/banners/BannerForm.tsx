import Link from "next/link"
import type { PromoBannerModel } from "@/app/generated/prisma/models/PromoBanner"
type PromoBanner = PromoBannerModel

const COLORS = [
  { value: "sky",    label: "Sky blue",  dot: "bg-sky-500" },
  { value: "amber",  label: "Amber",     dot: "bg-amber-400" },
  { value: "green",  label: "Green",     dot: "bg-green-500" },
  { value: "purple", label: "Purple",    dot: "bg-purple-500" },
]

interface Props {
  banner?: PromoBanner
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function BannerForm({ banner, action, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {banner && <input type="hidden" name="id" value={banner.id} />}

      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Content</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Message</label>
          <input
            type="text"
            name="message"
            required
            defaultValue={banner?.message}
            placeholder="🎉 Use code POOLOS20 for 20% off your first 3 months!"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Promo code (optional — shown as a copyable pill)</label>
          <input
            type="text"
            name="code"
            defaultValue={banner?.code ?? ""}
            placeholder="POOLOS20"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Appearance</h2>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Color</label>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map((c) => (
              <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bgColor"
                  value={c.value}
                  defaultChecked={(banner?.bgColor ?? "sky") === c.value}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded-full ${c.dot} ring-2 ring-offset-2 ring-transparent [input:checked+&]:ring-gray-700`} />
                <span className="text-sm text-gray-700">{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Visibility</h2>

        {[
          { name: "active",          label: "Active",                   desc: "Banner is live and visible",                       default: banner?.active ?? true },
          { name: "showOnMarketing", label: "Show on marketing pages",  desc: "Homepage, /pricing, and other public pages",        default: banner?.showOnMarketing ?? true },
          { name: "showInApp",       label: "Show inside the app",      desc: "Shown to companies on a free trial only",           default: banner?.showInApp ?? true },
          { name: "dismissible",     label: "Dismissible",              desc: "Users can close the banner (remembered per device)", default: banner?.dismissible ?? true },
        ].map((field) => (
          <label key={field.name} className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={field.default}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
              <span className="block text-xs text-gray-400 mt-0.5">{field.desc}</span>
            </span>
          </label>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-1">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Expiry</h2>
        <label className="text-xs font-medium text-gray-600">Expires at (leave blank for no expiry)</label>
        <input
          type="datetime-local"
          name="expiresAt"
          defaultValue={
            banner?.expiresAt
              ? new Date(banner.expiresAt.getTime() - banner.expiresAt.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)
              : ""
          }
          className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/banners"
          className="bg-gray-100 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
