"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import Button from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"

function CheckoutForm({ amount }: { amount: number }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href + "?paid=1",
      },
    })

    if (error) {
      setError(error.message ?? "Payment failed. Please try again.")
      setLoading(false)
    }
    // On success, Stripe redirects to return_url — no code runs here
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button type="submit" disabled={!stripe || loading} className="w-full justify-center">
        {loading ? "Processing…" : `Pay ${formatCurrency(amount)}`}
      </Button>
    </form>
  )
}

interface Props {
  clientSecret: string
  publishableKey: string
  stripeAccountId: string
  amount: number
}

export default function PaymentForm({ clientSecret, publishableKey, stripeAccountId, amount }: Props) {
  const stripePromise = loadStripe(publishableKey, { stripeAccount: stripeAccountId })

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0ea5e9",
            borderRadius: "8px",
            fontFamily: "Geist, system-ui, sans-serif",
          },
        },
      }}
    >
      <CheckoutForm amount={amount} />
    </Elements>
  )
}
