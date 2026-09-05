import type { ReactNode } from "react";
import type { ToolConfig } from "@/lib/types";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrivacyBadge } from "@/components/privacy-badge";
import { RelatedTools } from "@/components/related-tools";
import { AdSlot } from "@/components/ad-slot";

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function ToolPage({
  tool,
  card,
  steps,
  notes,
}: {
  tool: ToolConfig;
  card: ReactNode;
  steps: [string, string][];
  notes: string[];
}) {
  const Icon = tool.icon;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: tool.title, path: `/${tool.slug}` },
        ])}
      />
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

      <section className="mt-8" aria-label={`${tool.title} tool`}>
        {card}
      </section>

      <AdSlot className="mt-10" />

      {steps.length > 0 && (
        <section className="mt-16" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-xl font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {steps.map(([title, body], i) => (
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
      )}

      {notes.length > 0 && (
        <section className="mt-14" aria-labelledby="good-to-know">
          <h2 id="good-to-know" className="text-xl font-semibold tracking-tight text-foreground">
            Good to know
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {tool.faq.length > 0 && (
        <section className="mt-14" aria-labelledby="faq">
          <h2 id="faq" className="text-xl font-semibold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
          <JsonLd data={faqJsonLd(tool.faq)} />
          <div className="mt-4 space-y-3">
            {tool.faq.map((f) => (
              <details key={f.q} className="group rounded-card border border-border bg-surface p-5 shadow-card">
                <summary className="cursor-pointer list-none font-medium text-foreground">
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
      )}

      <RelatedTools ids={tool.related} />
    </div>
  );
}