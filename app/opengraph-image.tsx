import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "PoolOS — Pool Service Management Software"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-60px",
          left: "-60px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
          }}>
            〰️
          </div>
          <div style={{ fontSize: "72px", fontWeight: 800, color: "white", letterSpacing: "-2px" }}>
            PoolOS
          </div>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: "42px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
          maxWidth: "900px",
          lineHeight: 1.25,
          marginBottom: "20px",
        }}>
          The smarter way to run your pool service business
        </div>

        {/* Sub */}
        <div style={{
          fontSize: "22px",
          color: "rgba(255,255,255,0.70)",
          textAlign: "center",
          maxWidth: "780px",
          marginBottom: "44px",
        }}>
          Scheduling · Invoicing · Chemical Tracking · Customer Portal
        </div>

        {/* CTA pill */}
        <div style={{
          background: "white",
          color: "#0369a1",
          padding: "16px 44px",
          borderRadius: "16px",
          fontSize: "22px",
          fontWeight: 700,
        }}>
          Start free — 14 days, no credit card
        </div>
      </div>
    ),
    { ...size }
  )
}
