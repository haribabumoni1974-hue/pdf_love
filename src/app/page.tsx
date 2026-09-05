import { ArrowDown, Heart, Lock, ShieldCheck, Sparkles, UserX, Zap } from "lucide-react";
import { tools, readyTools } from "@/config/tools";
import { ToolGrid } from "@/components/tool-grid";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast, because it's local",
    body: "Every tool runs inside your browser. No server round-trips, no waiting in queues — results come back in seconds.",
  },
  {
    icon: Lock,
    title: "Your files stay yours",
    body: "Phase 1 tools process files entirely on your device. Nothing is uploaded, logged, or stored.",
  },
  {
    icon: UserX,
    title: "No account, no signup",
    body: "No emails, no passwords, no trial timers. Every tool is free and ready to use the moment you open it.",
  },
  {
    icon: ShieldCheck,
    title: "Honest about limits",
    body: "If a file is too large, corrupted, or uses unsupported features, we tell you exactly why — and what to try next.",
  },
];

const FAQ = [
  {
    q: "Are my files uploaded to a server?",
    a: "No. Every Phase 1 tool processes files entirely in your browser. Your PDFs never leave your device, and nothing is stored afterwards.",
  },
  {
    q: "Do I need an account?",
    a: "No. pdf_love is free, requires no account, and adds no watermark to your output.",
  },
  {
    q: "Are there limits on file size?",
    a: "Browser processing has practical limits. Each tool states its limits clearly (usually 30–50 MB per file), and tells you honestly when a file is too large to process reliably.",
  },
  {
    q: "What happens if a file can't be processed?",
    a: "You get a specific, actionable message — for example that a PDF is password-protected or corrupted — instead of a vague error. Files are never silently dropped.",
  },
  {
    q: "Is everything really free?",
    a: "Yes. All Phase 1 tools are free with no limits, no watermark and no payment wall.",
  },
];

export default function Home() {
  const Icon = Heart;
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          Free PDF tools · No uploads · No account
        </span>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          Love your PDFs.
          <br />
          Do more with them.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted">
          {`Free PDF tools designed to be simple, fast, and privacy-conscious. Everything runs right in your browser — your files never leave your device.`}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#tools"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-strong px-8 text-sm font-semibold text-white shadow-card transition-all hover:bg-accent sm:w-auto"
          >
            <Icon className="h-4 w-4 fill-current" aria-hidden="true" />
            Choose a PDF
          </a>
          <a
            href="#how-it-works"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-8 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 sm:w-auto"
          >
            See how it works
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="border-y border-border bg-surface" aria-label="Privacy promise">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {[
            ["Processed entirely in your browser", "Your files never leave your device"],
            ["No account required", "No email, no signup, no password"],
            ["Real output files", "Verified results, downloadable in one click"],
          ].map(([title, body]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ToolGrid
          id="tools"
          tools={tools}
          heading="All tools"
          footnote={
            readyTools.length === tools.length
              ? `All ${tools.length} tools are live. Every tool processes real files, verifies its output, and nothing here is simulated.`
              : `${readyTools.length} of ${tools.length} tools live so far — the rest are being built in the same framework and appear here as they ship. Every tool processes real files; nothing here is simulated.`
          }
        />
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted">
            Three steps, all of them local. No queues, no uploads, no surprises.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              ["Choose", "Pick a tool and select or drag in your files. Every file is validated before anything happens."],
              ["Process", "The tool runs in your browser and shows honest progress. Big jobs can be cancelled at any time."],
              ["Download", "Get your real, verified output file — no watermark, no account, no catch."],
            ].map(([title, body], i) => (
              <li key={title} className="relative rounded-card border border-border bg-background p-6 shadow-card">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="features">
        <h2 id="features" className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Built different, on purpose
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: FIcon, title, body }) => (
            <div key={title} className="rounded-card border border-border bg-surface p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <FIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 id="faq" className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-card border border-border bg-background p-5 shadow-card">
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
        </div>
      </section>
    </div>
  );
}