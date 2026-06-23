import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className="h-full">{children}</body>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-9DHZQXE2YH" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-9DHZQXE2YH');
      `}</Script>
    </html>
  );
}
