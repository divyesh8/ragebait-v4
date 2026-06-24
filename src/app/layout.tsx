import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ragebait — AI-Judged Roast Battles",
    template: "%s — Ragebait",
  },
  description:
    "Ragebait is the AI-powered arena for roast battles, debates, and meme wars. Win battles. Earn Aura. Zero pay-to-win.",
  keywords: ["roast battle", "AI judge", "aura", "meme war", "debate", "competitive", "social"],
  openGraph: {
    title: "Ragebait — Win the roast. Claim the Aura.",
    description: "AI-judged competitive social platform for Gen-Z.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ragebait",
    description: "AI-judged roast battles. Earn Aura through skill.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05030A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-void text-white antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
