import Link from "next/link"
import { Waves } from "lucide-react"

export default function MarketingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-sky-600 flex items-center justify-center">
                <Waves className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">PoolOS</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Pool service management software built for the way pool professionals actually work.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-6 text-sm w-full sm:w-auto">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</p>
              <Link href="/#features"     className="block hover:text-white transition-colors">Features</Link>
              <Link href="/pricing"    className="block hover:text-white transition-colors">Pricing</Link>
              <Link href="/#how-it-works" className="block hover:text-white transition-colors">How it works</Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tools</p>
              <Link href="/chemistry"  className="block hover:text-white transition-colors">Chem Calculator</Link>
              <Link href="/contact"    className="block hover:text-white transition-colors">Contact</Link>
              <Link href="/register"   className="block hover:text-white transition-colors">Sign up</Link>
            </div>
            <div className="space-y-2.5 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Legal</p>
              <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms"   className="block hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 text-xs text-gray-600">
          © {new Date().getFullYear()} PoolOS. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
