import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { updateBanner } from "@/lib/actions/admin-banners"
import BannerForm from "../BannerForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const banner = await db.promoBanner.findUnique({ where: { id } })
  if (!banner) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit banner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Changes go live immediately.</p>
        </div>
      </div>
      <BannerForm banner={banner} action={updateBanner} submitLabel="Save changes" />
    </div>
  )
}
