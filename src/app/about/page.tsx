import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { readyTools, tools } from "@/config/tools";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "What pdf_love is, why it exists, and the principles behind it.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">About pdf_love</h1>
      <p className="mt-3 text-lg leading-8 text-muted">
        Love your PDFs. Do more with them. pdf_love is a collection of free PDF tools that run directly in your browser —
        fast, simple, and private by design.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Why we built it</h2>
          <p className="mt-2 text-muted">
            Most PDF websites make you upload your documents to a server to do things your computer can easily do itself.
            That means waiting in queues, trusting a stranger with sensitive files, and wading through ads and upsells.
            pdf_love takes the opposite approach: the tools run where your files already are — in your browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Our principles</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
            <li><strong className="text-foreground">Privacy is structural.</strong> Files are processed locally; we don&apos;t ask for trust we don&apos;t need.</li>
            <li><strong className="text-foreground">Honesty over marketing.</strong> If a tool can&apos;t do something, it says so and explains why — no fake progress, no fake results.</li>
            <li><strong className="text-foreground">Real output, verified.</strong> Every result is a genuine file that is re-parsed and checked before download.</li>
            <li><strong className="text-foreground">Reliability over feature count.</strong> A small set of tools that work beats a large set that don&apos;t.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Current status</h2>
          <p className="mt-2 text-muted">
            All {tools.length} Phase 1 tools are live, and every one processes real files with verified output:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {readyTools.map((tool) => (
              <li key={tool.id}>
                <a
                  href={`/${tool.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft"
                >
                  <tool.icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  {tool.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-muted">
            Nothing here is simulated: every tool uploads nothing, processes locally, verifies its output, and only then
            offers a download.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Limitations we&apos;re upfront about</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
            <li>Browser-based processing has practical limits on file size and page count — we tell you the limit before you start.</li>
            <li>Some PDF features (certain encryption methods, exotic fonts, malformed structures) can&apos;t be handled reliably in a browser. We detect these cases and explain them instead of producing broken files.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-muted">
            Built with care by [your name or team — replace before launch]. Reach us at{" "}
            <span className="text-foreground">[your contact email — replace before launch]</span>.
          </p>
        </section>
      </div>
    </div>
  );
}