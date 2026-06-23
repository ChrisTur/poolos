"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Waves, Send, CheckCircle2 } from "lucide-react"
import { submitContactForm } from "@/lib/actions/contact"

export default function ContactPage() {
  const [state, action, pending] = useActionState(submitContactForm, null)

  return (
    <div className="min-h-screen bg-white">
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

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {state?.success ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Message sent</h1>
            <p className="text-gray-500 mb-8">
              We've received your message and will get back to you shortly.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sky-600 font-medium hover:underline text-sm"
            >
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Get in touch</h1>
              <p className="text-gray-500">
                Have a question about PoolOS? We typically respond within one business day.
              </p>
            </div>

            <form action={action} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="jane@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g. Question about pricing"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  rows={5}
                  required
                  placeholder="Tell us how we can help…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {pending ? "Sending…" : "Send message"}
              </button>
            </form>
          </>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} PoolOS. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/"        className="hover:text-gray-600">Home</Link>
          <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
          <Link href="/terms"   className="hover:text-gray-600">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
