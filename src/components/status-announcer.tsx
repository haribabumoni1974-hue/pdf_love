"use client";

export function StatusAnnouncer({ message }: { message: string }) {
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {message}
    </div>
  );
}