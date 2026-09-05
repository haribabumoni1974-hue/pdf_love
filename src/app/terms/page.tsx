import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: "The terms that apply when you use pdf_love's free browser-based PDF tools.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }]} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Using pdf_love</h2>
          <p className="mt-2 text-muted">
            By using pdf_love you agree to these terms. The service provides free, browser-based PDF tools. You are
            responsible for the files you process and for making sure you have the right to process them (for example,
            that you own a document or are allowed to modify it).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">No warranties</h2>
          <p className="mt-2 text-muted">
            The tools are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. We work
            hard to make every tool reliable, and outputs are verified before download, but we cannot guarantee that every
            file will process successfully in every browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Your responsibility</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
            <li>Keep backups of your original files. Local processing never modifies files on disk, but we are not responsible for data loss.</li>
            <li>Only process files you own or have permission to modify.</li>
            <li>Do not use the tools to circumvent access controls you are not authorized to bypass.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Limitation of liability</h2>
          <p className="mt-2 text-muted">
            To the maximum extent permitted by law, pdf_love is not liable for indirect or consequential damages arising
            from the use of the service. Your use is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Changes</h2>
          <p className="mt-2 text-muted">
            We may update these terms as the service evolves. Continued use after changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about these terms? Contact the operator at{" "}
            <span className="text-foreground">[your contact email — replace before launch]</span>.
          </p>
        </section>
      </div>
    </div>
  );
}