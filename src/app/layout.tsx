import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    siteName: site.name,
    type: "website",
  },
};

/**
 * Sets the theme class before React hydrates so there is no flash of the
 * wrong theme. Mirrors the logic in the ThemeProvider. This is a module-level
 * constant — the exact same string is emitted by the server on every request,
 * so it can never differ between server render and client hydration.
 */
const themeBootstrap = `(function(){try{var t=localStorage.getItem("pdf_love:theme");var dark=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/*
         * Why suppressHydrationWarning is on this <script>, and why it is not
         * a workaround:
         *
         * 1. The script deliberately mutates <html> (adds .dark) before React
         *    hydrates — hence suppressHydrationWarning on <html> above.
         * 2. The server emits the exact same constant string on every render
         *    (verified in the served HTML), so there is nothing inherently
         *    mismatched about this node.
         * 3. Browser extensions inject <script> nodes into <head> before React
         *    hydrates. React 19 then positionally pairs this element with the
         *    extension's node and reports a fake prop diff (our __html vs the
         *    extension's src). suppressHydrationWarning tells React to accept
         *    whatever DOM node it finds — the correct, documented handling for
         *    pre-hydration DOM mutation by third parties.
         * 4. Correctness never depends on this node surviving hydration:
         *    ThemeProvider re-applies the theme in a pre-paint layout effect.
         */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent-strong focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}