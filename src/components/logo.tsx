import Link from "next/link";
import { Heart } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 rounded-lg text-foreground ${className}`}
      aria-label="pdf_love — home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-card transition-transform group-hover:scale-105">
        <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">pdf_love</span>
    </Link>
  );
}