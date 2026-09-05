import type { ToolConfig } from "@/lib/types";
import { ToolCard } from "@/components/tool-card";

export function ToolGrid({
  tools,
  id,
  heading,
  footnote,
}: {
  tools: ToolConfig[];
  id?: string;
  heading?: string;
  footnote?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="scroll-mt-24">
      {heading && (
        <h2 id={id ? `${id}-heading` : undefined} className="text-2xl font-semibold tracking-tight text-foreground">
          {heading}
        </h2>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      {footnote && <p className="mt-4 text-sm text-muted">{footnote}</p>}
    </section>
  );
}