import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0284c7",
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"),
  title: {
    default: "PoolOS — Pool Service Management Software",
    template: "%s | PoolOS",
  },
  description:
    "Pool service management software for scheduling, invoicing, chemical tracking, and customer communication. Start free for 14 days.",
  openGraph: {
    siteName: "PoolOS",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PoolOS",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="h-full">
        {children}
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
