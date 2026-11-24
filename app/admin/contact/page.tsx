import Link from "next/link"
import { db } from "@/lib/db"
import { Mail, ShieldAlert } from "lucide-react"
import ContactMessageList from "./ContactMessageList"

export const dynamic = "force-dynamic"
export const metadata = { title: "Contact Inbox — PoolOS Admin" }

type Props = { searchParams: Promise<{ tab?: string }> }

export default async function ContactInboxPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const showSpam = tab === "spam"

  const [inbox, spamMessages] = await Promise.all([
    db.contactMessage.findMany({
      where:   { status: { not: "spam" } },
      orderBy: { createdAt: "desc" },
    }),
    db.contactMessage.findMany({
      where:   { status: "spam" },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const messages = showSpam ? spamMessages : inbox
  const unread   = inbox.filter((m) => m.status === "new").length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Inbox</h1>
          {!showSpam && unread > 0 && (
            <p className="text-sm text-sky-600 font-medium mt-0.5">{unread} unread</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <Link
          href="/admin/contact"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !showSpam ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Inbox
          {inbox.length > 0 && (
            <span className={`ml-1.5 text-xs ${!showSpam ? "text-sky-200" : "text-gray-400"}`}>{inbox.length}</span>
          )}
        </Link>
        <Link
          href="/admin/contact?tab=spam"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showSpam ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Spam
          {spamMessages.length > 0 && (
            <span className={`ml-1.5 text-xs ${showSpam ? "text-red-200" : "text-gray-400"}`}>{spamMessages.length}</span>
          )}
        </Link>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {showSpam
            ? <><ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No spam</p><p className="text-sm mt-1">Automatically detected spam will appear here.</p></>
            : <><Mail className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No messages yet</p><p className="text-sm mt-1">Contact form submissions will appear here.</p></>
          }
        </div>
      ) : (
        <ContactMessageList messages={messages} showSpam={showSpam} />
      )}
    </div>
  )
}
