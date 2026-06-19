"use client"

import { useState } from "react"
import { Link2, Check } from "lucide-react"
import Button from "@/components/ui/Button"

export default function CopyPayLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy} title="Copy payment link">
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Pay Link"}</span>
    </Button>
  )
}
