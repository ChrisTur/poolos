import { createBanner } from "@/lib/actions/admin-banners"
import BannerForm from "../BannerForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New banner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Banner goes live the moment you save it.</p>
        </div>
      </div>
      <BannerForm action={createBanner} submitLabel="Create banner" />
    </div>
  )
}
