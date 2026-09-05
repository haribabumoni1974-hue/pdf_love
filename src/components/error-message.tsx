import { AlertTriangle } from "lucide-react";

export function ErrorMessage({ title = "Something went wrong", detail }: { title?: string; detail?: string }) {
  return (
    <div role="alert" className="rounded-card border border-danger/25 bg-danger-soft p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold text-danger">{title}</p>
          {detail && <p className="mt-1 text-danger/90">{detail}</p>}
        </div>
      </div>
    </div>
  );
}