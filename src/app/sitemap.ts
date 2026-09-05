import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { readyTools } from "@/config/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/privacy", "/terms", "/about"];
  return [
    ...staticPages.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.5,
    })),
    ...readyTools.map((tool) => ({
      url: `${site.url}/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}