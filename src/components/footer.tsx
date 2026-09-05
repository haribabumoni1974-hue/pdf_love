import Link from "next/link";
import { Logo } from "@/components/logo";
import { readyTools } from "@/config/tools";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Love your PDFs. Do more with them. Free PDF tools that run entirely
            in your browser — no uploads, no account, no watermark.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tools</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {readyTools.map((tool) => (
              <li key={tool.id}>
                <Link href={`/${tool.slug}`} className="text-muted transition-colors hover:text-foreground">
                  {tool.title}
                </Link>
              </li>
            ))}
            <li className="text-xs text-muted/70">
              All core tools are live — every one processes real files locally.
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Company</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-muted transition-colors hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted transition-colors hover:text-foreground">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-muted transition-colors hover:text-foreground">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} pdf_love. All processing happens locally in your browser.</p>
          <p>Free forever · No account · No uploads</p>
        </div>
      </div>
    </footer>
  );
}