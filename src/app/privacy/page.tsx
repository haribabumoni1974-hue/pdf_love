import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How pdf_love handles your files: Phase 1 tools process everything locally in your browser. Nothing is uploaded, logged, or stored.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }]} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">The short version</h2>
          <p className="mt-2 text-muted">
            pdf_love is built around one principle: <strong className="text-foreground">your files should not have to leave your device to be worked with.</strong>{" "}
            All Phase 1 tools process files entirely in your browser. We do not upload, store, log, or analyze your documents.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What happens to your files</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
            <li>Files you select are read only in your browser&apos;s memory.</li>
            <li>Processing runs locally on your device using JavaScript libraries loaded with the page.</li>
            <li>Generated results are downloaded directly from your browser — they never pass through our servers.</li>
            <li>Nothing is stored permanently on our side, because nothing is ever sent to us.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What we do store</h2>
          <p className="mt-2 text-muted">
            Very little, and nothing personal by default. Your theme preference (light, dark, or system) is saved in your
            browser&apos;s local storage on this device only. We do not use tracking cookies, and we do not serve third-party
            analytics scripts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Advertising</h2>
          <p className="mt-2 text-muted">
            The site reserves clearly labeled advertising slots for the future. If ads are ever enabled, this policy will be
            updated to describe the data practices involved. No advertising code is currently loaded.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p className="mt-2 text-muted">
            Uploaded content is treated as untrusted data. Files are validated before processing, generated outputs are
            re-parsed and verified, and temporary object URLs are released when no longer needed. Because processing is
            local, your documents are not exposed to the network at all.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Future phases</h2>
          <p className="mt-2 text-muted">
            Future versions may add server-side processing for operations browsers cannot do alone. If and when that
            happens, this page will be updated to describe exactly what is uploaded, where it goes, and how long it is kept —
            before any such feature ships.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about this policy? Contact the operator at{" "}
            <span className="text-foreground">[your contact email — replace before launch]</span>.
          </p>
        </section>
      </div>
    </div>
  );
}