import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const reference = searchParams.get("reference") ?? "John 3:16";
  const text = searchParams.get("text") ?? "For God so loved the world…";
  const translation = searchParams.get("translation") ?? "NIV";

  // Truncate long text for card readability
  const displayText = text.length > 200 ? text.slice(0, 197) + "…" : text;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #0d1b2e 0%, #1a3a6e 55%, #0d2040 100%)",
          position: "relative",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Gold top stripe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #c9a227, #fde68a, #c9a227)",
          }}
        />

        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 65%)",
          }}
        />

        {/* Cross watermark */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 50,
            opacity: 0.07,
            display: "flex",
          }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
            <rect x="10" y="3" width="4" height="18" rx="1" />
            <rect x="3" y="9" width="18" height="4" rx="1" />
          </svg>
        </div>

        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 70px",
          }}
        >
          {/* Opening quote mark */}
          <div
            style={{
              fontSize: 120,
              lineHeight: 1,
              color: "rgba(201,162,39,0.25)",
              fontFamily: "serif",
              marginBottom: -20,
              marginLeft: -10,
            }}
          >
            &ldquo;
          </div>

          {/* Verse text */}
          <div
            style={{
              fontSize: displayText.length > 120 ? 36 : 44,
              lineHeight: 1.5,
              color: "#ffffff",
              fontFamily: "serif",
              fontStyle: "italic",
              marginBottom: 36,
            }}
          >
            {displayText}
          </div>

          {/* Reference + translation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#c9a227",
                fontFamily: "sans-serif",
                letterSpacing: 1,
              }}
            >
              — {reference}
            </div>
            <div
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "sans-serif",
              }}
            >
              {translation}
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 40,
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #c9a227, #fde68a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "#0d1b2e", fontSize: 18, fontWeight: 700 }}>W</div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
            }}
          >
            Walk Daily
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
