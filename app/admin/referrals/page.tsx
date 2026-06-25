import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { createReferralCode, toggleReferralCode, deleteReferralCode } from "@/lib/actions/admin-referrals"
import { formatDate } from "@/lib/utils"
import { Plus, Eye, EyeOff, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

const inputCls =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function AdminReferralsPage() {
  await requireSuperAdmin()

  const [codes, referrals] = await Promise.all([
    db.referralCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { uses: true } } },
    }),
    db.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { code: { select: { code: true } } },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-sm text-gray-500 mt-1">Manage referral codes and track sign-ups.</p>
      </div>

      {/* Create new code */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">New Referral Code</h2>
        <form action={createReferralCode} className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Code *</label>
            <input type="text" name="code" required placeholder="POOLPRO" className={`${inputCls} font-mono uppercase`} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Label</label>
            <input type="text" name="label" placeholder="Partner campaign" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Reward</label>
            <input type="text" name="reward" placeholder="1 free month" defaultValue="1 free month" className={inputCls} />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </form>
      </div>

      {/* Codes list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Referral Codes</h2>
        {codes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No referral codes yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Code</th>
                  <th className="px-5 py-3 text-left font-medium">Label</th>
                  <th className="px-5 py-3 text-left font-medium">Reward</th>
                  <th className="px-5 py-3 text-left font-medium">Uses</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {codes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                    <td className="px-5 py-3 text-gray-600">{c.label ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-600">{c.reward}</td>
                    <td className="px-5 py-3 text-gray-600">{c._count.uses}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <form action={toggleReferralCode}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="active" value={String(c.isActive)} />
                          <button
                            type="submit"
                            title={c.isActive ? "Deactivate" : "Activate"}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            {c.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </form>
                        <form action={deleteReferralCode}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent referrals */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Referrals</h2>
        {referrals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No referrals yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Code Used</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{r.email ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 font-mono text-gray-600">{r.code.code}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
