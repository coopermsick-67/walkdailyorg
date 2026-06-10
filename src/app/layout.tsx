import type { Metadata, Viewport } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AddToHomeScreen } from "@/components/ui/AddToHomeScreen";

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Walk Daily - Your Daily Faith Companion",
  description:
    "A free AI-powered Christian companion for daily Bible reading, prayer, journaling, and spiritual growth.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Walk Daily",
  },
  openGraph: {
    title: "Walk Daily",
    description:
      "Your daily faith companion - Bible, prayer, journal, and AI chat.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a3a6e" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1b2e" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Root Layout                                                        */
/* ------------------------------------------------------------------ */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ToastProvider>
            {/* Skip navigation link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
              style={{
                background: "var(--color-primary-500)",
                color: "#fff",
              }}
            >
              Skip to main content
            </a>

            {/* Main content area */}
            <main id="main-content" className="flex-1 flex flex-col pb-20 md:pb-0" tabIndex={-1}>
              {children}
            </main>

            {/* PWA install prompt */}
            <AddToHomeScreen />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
