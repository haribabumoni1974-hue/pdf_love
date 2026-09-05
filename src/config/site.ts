export const site = {
  name: "pdf_love",
  tagline: "Love your PDFs. Do more with them.",
  description:
    "Free PDF tools that run directly in your browser. Merge, split, compress, rotate, protect and more — no uploads, no account, no watermark.",
  /**
   * Canonical origin used for SEO metadata, sitemap and robots.txt.
   * Set NEXT_PUBLIC_SITE_URL to the production domain (e.g. https://pdf-love.app)
   * before deploying; the placeholder keeps local builds consistent.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pdf-love.vercel.app",
  /** Reserved ad slots are rendered only when this is enabled (AdSense setup is out of Phase 1 scope). */
  adsEnabled: false,
} as const;