import Link from "next/link";
import { getToolById } from "@/config/tools";

/** Related-tool suggestions; only links to tools that genuinely exist. */
export function RelatedTools({ ids }: { ids: string[] }) {
  const related = ids
    .map((id) => getToolById(id))
    .filter((tool) => tool.status === "ready");

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-16">
      <h2 id="related-heading" className="text-lg font-semibold text-foreground">
        Related tools
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {related.map((tool) => (
          <li key={tool.id}>
            <Link
              href={`/${tool.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft"
            >
              <tool.icon className="h-4 w-4 text-accent" aria-hidden="true" />
              {tool.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}