"use client"

import { useActionState, useRef, useEffect } from "react"
import { replyToContact } from "@/lib/actions/contact"
import { Send } from "lucide-react"

export default function ContactReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(replyToContact, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state?.success])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="replyBody"
        rows={5}
        required
        placeholder="Write your reply…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
      />
      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600 font-medium">Reply sent successfully.</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-60"
        >
          <Send className="w-3.5 h-3.5" />
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  )
}
