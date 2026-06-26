import { db } from "@/lib/db"
import FeedbackForm from "./FeedbackForm"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ rating?: string }>
}

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { rating: ratingParam } = await searchParams

  const visit = await db.serviceVisit.findUnique({
    where: { feedbackToken: token },
    select: {
      id: true,
      rating: true,
      feedbackComment: true,
      visitedAt: true,
      customer: {
        select: {
          firstName: true,
          company: { select: { name: true } },
        },
      },
    },
  })

  // Link not found
  if (!visit) {
    return (
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 16px" }}>🔗</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Link expired or invalid</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>This feedback link is no longer active.</p>
      </div>
    )
  }

  // Already rated
  if (visit.rating != null) {
    const stars = "⭐".repeat(visit.rating)
    return (
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 16px" }}>{stars}</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Thank you for your feedback!</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 4px" }}>
          You rated your service <strong>{visit.rating}/5</strong>.
        </p>
        {visit.feedbackComment && (
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "12px 0 0", fontStyle: "italic" }}>"{visit.feedbackComment}"</p>
        )}
      </div>
    )
  }

  const preSelected = ratingParam ? parseInt(ratingParam, 10) : undefined
  const preRating = preSelected && preSelected >= 1 && preSelected <= 5 ? preSelected : undefined

  return (
    <FeedbackForm
      token={token}
      customerFirstName={visit.customer.firstName}
      companyName={visit.customer.company.name}
      visitedAt={visit.visitedAt.toISOString()}
      preRating={preRating}
    />
  )
}
