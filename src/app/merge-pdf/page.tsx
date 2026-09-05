import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { breadcrumbJsonLd, faqJsonLd, toolMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrivacyBadge } from "@/components/privacy-badge";
import { RelatedTools } from "@/components/related-tools";
import { AdSlot } from "@/components/ad-slot";
import { MergeToolCard } from "@/features/tools/merge/merge-tool";

const tool = getToolBySlug("merge-pdf");

export const metadata: Metadata = toolMetadata(tool);

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function MergePdfPage() {
  const Icon = tool.icon;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: tool.title, path: `/${tool.slug}` }])} />

      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: tool.title, path: `/${tool.slug}` }]} />

      <header className="mt-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{tool.title}</h1>
            <p className="mt-1 text-muted">{tool.shortDescription}</p>
          </div>
        </div>
        <div className="mt-4">
          <PrivacyBadge message={tool.privacyMessage} />
        </div>
      </header>

      <section className="mt-8" aria-label="Merge tool">
        <MergeToolCard />
      </section>

      <AdSlot className="mt-10" />

      <section className="mt-16 space-y-6" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-xl font-semibold tracking-tight text-foreground">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            ["Add your PDFs", "Drag in two or more PDF files. Each one is checked and validated before merging."],
            ["Put them in order", "Reorder the files however you like — the merged document follows your order."],
            ["Merge & download", "The combined PDF is built and verified in your browser, then downloaded as merged.pdf."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-card border border-border bg-surface p-5 shadow-card">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="limitations">
        <h2 id="limitations" className="text-xl font-semibold tracking-tight text-foreground">
          Good to know
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>Each file can be up to {tool.validationRules.maxFileSizeMB} MB, with a maximum of {tool.validationRules.maxPagesTotal} total pages.</li>
          <li>Password-protected PDFs must be unlocked before they can be merged — the Unlock PDF tool can help.</li>
          <li>Text stays searchable and selectable in the merged file; no quality is lost during merging.</li>
          <li>Nothing is uploaded. Processing happens entirely in your browser, and no copy is kept afterwards.</li>
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-semibold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <JsonLd data={faqJsonLd(tool.faq)} />
        <div className="mt-4 space-y-3">
          {tool.faq.map((f) => (
            <details key={f.q} className="group rounded-card border border-border bg-surface p-5 shadow-card">
              <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none">
                {f.q}
                <span className="float-right text-accent transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <RelatedTools ids={tool.related} />
    </div>
  );
}