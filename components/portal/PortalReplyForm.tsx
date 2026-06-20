"use client"

import { useActionState, useRef, useEffect } from "react"
import { sendPortalMessage } from "@/lib/actions/portal"
import { Send } from "lucide-react"

export default function PortalReplyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => sendPortalMessage(_, formData),
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state?.success])

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="token" value={token} />
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Send a message to your pool company…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
      />
      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600">Message sent!</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <Send className="w-3.5 h-3.5" />
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  )
}
