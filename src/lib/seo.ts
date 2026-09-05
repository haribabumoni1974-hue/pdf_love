import type { Metadata } from "next";
import type { ToolConfig } from "@/lib/types";
import { site } from "@/config/site";

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${site.url}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: site.name,
      type: "website",
    },
  };
}

// Brand suffix is appended by the root layout's title template.
export function toolMetadata(tool: ToolConfig): Metadata {
  return pageMetadata({
    title: `${tool.title} — ${tool.shortDescription}`,
    description: tool.metaDescription,
    path: `/${tool.slug}`,
    keywords: tool.keywords,
  });
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const url = (path: string) => `${site.url}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: url(item.path),
    })),
  };
}

export function faqJsonLd(faq: ToolConfig["faq"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}