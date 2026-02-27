import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Preloader } from "@/components/preloader";
import { VideoBackground } from "@/components/video-background";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0C0E12",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Benchmarks.live | AI Ecosystem Tracker",
    template: "%s | Benchmarks.live",
  },
  description:
    "Real-time rankings of 200+ AI models, tools, and infrastructure by composite AI Cap Score. Quality benchmarks, developer adoption, social momentum in one view.",
  keywords: [
    "AI rankings",
    "AI benchmarks",
    "LLM leaderboard",
    "AI market cap",
    "GPT-5",
    "Claude",
    "Gemini",
    "AI tools",
    "model comparison",
  ],
  openGraph: {
    title: "Benchmarks.live | AI Ecosystem Tracker",
    description:
      "Real-time rankings of 200+ AI models, tools, and infrastructure. The CoinMarketCap for AI.",
    type: "website",
    siteName: "Benchmarks.live",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benchmarks.live | AI Ecosystem Tracker",
    description:
      "Real-time rankings of 200+ AI models, tools, and infrastructure.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-bg-primary text-text-primary`}
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        <Preloader />
        <VideoBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
