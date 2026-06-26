"use client"

import { useState, useTransition } from "react"
import { submitFeedback } from "@/lib/actions/feedback"

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent!",
}

interface Props {
  token: string
  customerFirstName: string
  companyName: string
  visitedAt: string
  preRating?: number
}

export default function FeedbackForm({ token, customerFirstName, companyName, visitedAt, preRating }: Props) {
  const [rating, setRating] = useState<number | undefined>(preRating)
  const [hovered, setHovered] = useState<number | undefined>(undefined)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  const visibleRating = hovered ?? rating

  const visitDate = new Date(visitedAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) {
      setError("Please select a star rating.")
      return
    }
    setError(undefined)
    startTransition(async () => {
      const result = await submitFeedback(token, rating, comment)
      if (result.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 16px" }}>{"⭐".repeat(rating ?? 0)}</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Thank you, {customerFirstName}!</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Your feedback helps us improve our service.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 480,
        width: "100%",
        background: "#fff",
        borderRadius: 16,
        padding: "40px 32px",
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: "#0ea5e9", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 6px" }}>
          {companyName}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>How did we do?</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Service visit on {visitDate}</p>
      </div>

      {/* Star rating */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(undefined)}
            aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              border: `2px solid ${(visibleRating ?? 0) >= n ? "#fbbf24" : "#e5e7eb"}`,
              background: (visibleRating ?? 0) >= n ? "#fefce8" : "#f9fafb",
              fontSize: 26,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.1s, background 0.1s",
              padding: 0,
            }}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* Rating label */}
      <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", minHeight: 20, margin: "0 0 20px" }}>
        {rating ? RATING_LABELS[rating] : " "}
      </p>

      {/* Comment */}
      <div style={{ marginBottom: 20 }}>
        <label
          htmlFor="feedback-comment"
          style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
        >
          Comments <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Tell us what you thought..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            fontSize: 14,
            color: "#111827",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12, textAlign: "center" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !rating}
        style={{
          width: "100%",
          padding: "12px 0",
          background: rating ? "#0ea5e9" : "#e5e7eb",
          color: rating ? "#fff" : "#9ca3af",
          fontSize: 15,
          fontWeight: 600,
          border: "none",
          borderRadius: 10,
          cursor: rating ? "pointer" : "default",
          transition: "background 0.15s",
        }}
      >
        {isPending ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  )
}
