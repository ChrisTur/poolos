import type { Metadata } from "next"
import ContactForm from "@/components/contact/ContactForm"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "Contact Us — PoolOS Pool Service Software",
  description: "Have a question about PoolOS? Get in touch with our team. We typically respond within one business day.",
  alternates: { canonical: `${BASE}/contact` },
  openGraph: {
    title: "Contact PoolOS",
    description: "Have a question about PoolOS pool service software? We're here to help.",
    url: `${BASE}/contact`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact PoolOS",
    description: "Have a question? Get in touch with the PoolOS team.",
  },
}

export default function ContactPage() {
  return <ContactForm />
}
