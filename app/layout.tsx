import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { UserMenu } from "@/components/layout/UserMenu";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions";
import "./globals.css";

// Self-host fonts via next/font: no FOIT, no Google Fonts CDN dependency.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Synapse — Learn AI, ML & GenAI, deeply.",
    template: "%s · Synapse",
  },
  description:
    "University-grade Artificial Intelligence, Machine Learning, and Generative AI lessons — interactive, visual, and free.",
};

// Inline script to set the theme before React hydrates — prevents FOUC.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const accountSlot = session?.user ? (
    <UserMenu user={session.user} signOutAction={signOutAction} />
  ) : (
    <Link
      href="/signin"
      className="inline-flex h-9 items-center rounded-sm border border-border-strong px-3 text-body-sm font-medium transition-colors hover:bg-subtle"
    >
      Sign in
    </Link>
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="flex min-h-screen flex-col bg-canvas text-text-primary">
          <TopNav accountSlot={accountSlot} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
