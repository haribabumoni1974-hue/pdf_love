import { Lock } from "lucide-react";

export function PrivacyBadge({ message }: { message: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success-soft px-3 py-1.5 text-sm font-medium text-success">
      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      {message}
      <span className="sr-only">. Your files are never uploaded.</span>
    </p>
  );
}