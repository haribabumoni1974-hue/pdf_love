import {
  FileImage,
  FileMinus,
  FileOutput,
  Image,
  Layers,
  ListOrdered,
  Lock,
  Minimize2,
  RotateCw,
  Scissors,
  Unlock,
} from "lucide-react";
import type { ToolConfig } from "@/lib/types";

const PDF_RULES = {
  extensions: ["pdf"],
  mimeTypes: ["application/pdf"],
  minFiles: 1,
  maxFiles: 10,
  maxFileSizeMB: 50,
  maxPagesPerFile: 500,
  maxPagesTotal: 2000,
} as const;

const IMAGE_RULES = {
  extensions: ["jpg", "jpeg"],
  mimeTypes: ["image/jpeg"],
  minFiles: 1,
  maxFiles: 20,
  maxFileSizeMB: 30,
  maxPagesPerFile: 1,
  maxPagesTotal: 2000,
} as const;

const SINGLE_PDF = { ...PDF_RULES, minFiles: 1, maxFiles: 1 } as const;

const LOCAL_CAPABILITIES = {
  localProcessing: true,
  multipleFiles: true,
  supportsPreview: false,
  supportsBatch: false,
  supportsCancellation: true,
  maxRecommendedSizeMB: 50,
  requiresPassword: false,
  acceptsEncrypted: false,
} as const;

/**
 * The single source of truth for every tool. Pages, cards, related-tool
 * suggestions and processing all read from this registry. A tool is
 * `status: "ready"` only when its page and processor genuinely work;
 * `planned` entries carry honest metadata but are not clickable yet.
 */
export const tools: ToolConfig[] = [
  {
    id: "merge",
    slug: "merge-pdf",
    title: "Merge PDF",
    shortDescription: "Combine multiple PDFs into one file",
    metaDescription:
      "Combine several PDF files into a single document, in the order you choose. Free, private and processed entirely in your browser.",
    longDescription:
      "Combine two or more PDF files into one document. Reorder the files before merging, remove any you don't need, and download the result instantly. Everything happens locally in your browser — your files are never uploaded.",
    category: "pdf",
    icon: Layers,
    keywords: ["merge pdf", "combine pdf", "join pdf files", "merge pdf online free"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: true },
    validationRules: { ...PDF_RULES, minFiles: 2, maxFiles: 10 },
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Can I merge PDFs without uploading them?",
        a: "Yes. pdf_love runs entirely in your browser, so your PDFs never leave your device.",
      },
      {
        q: "How many PDFs can I merge at once?",
        a: "You can merge up to 10 PDFs at a time, as long as each file is under 50 MB.",
      },
      {
        q: "Can I change the order before merging?",
        a: "Yes — drag the files into the order you want, or use the arrow buttons. The merged PDF follows your chosen order.",
      },
    ],
    related: ["split", "compress", "organize"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/merge"),
  },
  {
    id: "split",
    slug: "split-pdf",
    title: "Split PDF",
    shortDescription: "Extract page ranges into separate PDFs",
    metaDescription:
      "Split a PDF by page ranges or extract single pages into separate files. Free and processed entirely in your browser.",
    longDescription:
      "Split a PDF into separate documents by page ranges, or extract individual pages into their own files. Choose your ranges, then download the resulting PDFs — every file is real and verified.",
    category: "pdf",
    icon: Scissors,
    keywords: ["split pdf", "extract pages pdf", "separate pdf pages"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Can I split a PDF into single pages?",
        a: "Yes — choose 'Each page separately' and every page becomes its own PDF. For large documents, page ranges are more practical.",
      },
      {
        q: "How many parts can I create?",
        a: "Up to 100 files per run, to protect your browser's memory. Use wider ranges for larger documents.",
      },
    ],
    related: ["extract", "merge", "remove"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/split"),
  },
  {
    id: "compress",
    slug: "compress-pdf",
    title: "Compress PDF",
    shortDescription: "Reduce PDF file size",
    metaDescription:
      "Reduce the size of a PDF by rebuilding its internal structure. Honest results with real before/after sizes — processed in your browser.",
    longDescription:
      "Reduce a PDF's file size by rebuilding its internal structure. Compression results vary from file to file — you'll always see the real before/after sizes, and if the file can't be made smaller we'll say so and return the original unchanged.",
    category: "pdf",
    icon: Minimize2,
    keywords: ["compress pdf", "reduce pdf size", "shrink pdf file"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Will my PDF always get smaller?",
        a: "No. This tool rebuilds the file's internal structure without degrading your content or re-encoding images. If that doesn't make the file smaller, we tell you honestly and return the original.",
      },
    ],
    related: ["merge", "jpg-to-pdf", "rotate"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/compress"),
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    title: "Rotate PDF",
    shortDescription: "Rotate pages 90°, 180° or 270°",
    metaDescription:
      "Rotate all or selected pages of a PDF by 90, 180 or 270 degrees. Free and processed entirely in your browser.",
    longDescription:
      "Rotate individual pages or the whole document by 90°, 180° or 270°. Useful for scanned documents and photos that are sideways.",
    category: "pdf",
    icon: RotateCw,
    keywords: ["rotate pdf", "turn pdf pages", "rotate pdf page"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Can I rotate just one page?",
        a: "Yes. Enter the pages you want to rotate (e.g. 3 or 1-4); pages you don't select stay as they are.",
      },
    ],
    related: ["organize", "remove", "merge"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/rotate"),
  },
  {
    id: "remove",
    slug: "remove-pages",
    title: "Remove Pages",
    shortDescription: "Delete unwanted pages from a PDF",
    metaDescription:
      "Remove unwanted pages from a PDF. Pick the pages, confirm, and download the cleaned-up document — all in your browser.",
    longDescription:
      "Delete unwanted pages from a PDF — blank pages, scanned duplicates, covers. Select pages by range, then download the result. Your original file is never modified on disk.",
    category: "pdf",
    icon: FileMinus,
    keywords: ["remove pages from pdf", "delete pdf pages", "delete blank pages pdf"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Can I undo a page removal?",
        a: "Only by processing again. Your original file is untouched — we work on a copy in memory — so keep the original until you're happy with the result.",
      },
    ],
    related: ["extract", "rotate", "organize"],
    status: "ready",
    loadProcessor: async () => ({ default: (await import("@/lib/processors/pages")).removePages }),
  },
  {
    id: "extract",
    slug: "extract-pages",
    title: "Extract Pages",
    shortDescription: "Pull selected pages into a new PDF",
    metaDescription:
      "Extract selected pages or ranges (e.g. 1-3, 7, 10-12) into a new PDF. Free and processed entirely in your browser.",
    longDescription:
      "Pull specific pages out of a PDF into a new document. Enter ranges like 1-3, 7, 10-12 and download just the pages you need.",
    category: "pdf",
    icon: FileOutput,
    keywords: ["extract pages from pdf", "select pages pdf", "save selected pdf pages"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "What page formats are supported?",
        a: "Single pages (3), ranges (4-9) and combinations (1-3, 7, 10-12) all work.",
      },
    ],
    related: ["split", "remove", "merge"],
    status: "ready",
    loadProcessor: async () => ({ default: (await import("@/lib/processors/pages")).extractPages }),
  },
  {
    id: "organize",
    slug: "organize-pdf",
    title: "Organize PDF",
    shortDescription: "Reorder, remove or duplicate pages",
    metaDescription:
      "Reorder PDF pages, remove pages, and save the organized document — all in your browser.",
    longDescription:
      "Rearrange the pages of a PDF exactly how you want them. Move pages into a new order, remove unwanted ones — then download the organized document.",
    category: "pdf",
    icon: ListOrdered,
    keywords: ["organize pdf", "reorder pdf pages", "rearrange pdf pages"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Can I move a page to the start of the document?",
        a: "Yes — use the arrows to move any page to any position, and remove the pages you don't need.",
      },
    ],
    related: ["remove", "rotate", "merge"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/organize"),
  },
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    shortDescription: "Turn JPG images into a PDF",
    metaDescription:
      "Convert one or more JPG images into a single PDF, in the order you choose. Free and processed entirely in your browser.",
    longDescription:
      "Turn JPG images into a clean PDF document. Add several images, arrange them in the order you want, and download your PDF — images are embedded at their original resolution.",
    category: "image",
    icon: Image,
    keywords: ["jpg to pdf", "jpeg to pdf", "convert images to pdf"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: true },
    validationRules: { ...IMAGE_RULES, minFiles: 1 },
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Does JPG to PDF reduce image quality?",
        a: "No. Images are embedded at their original resolution, so quality is preserved (the PDF may be large).",
      },
    ],
    related: ["pdf-to-jpg", "compress", "merge"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/jpg-to-pdf"),
  },
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    shortDescription: "Convert PDF pages to JPG images",
    metaDescription:
      "Convert all PDF pages to JPG images at your chosen quality. Free and processed entirely in your browser.",
    longDescription:
      "Convert PDF pages to high-quality JPG images. Choose a quality level, then download the images — every file is rendered from the real page.",
    category: "image",
    icon: FileImage,
    keywords: ["pdf to jpg", "pdf to image", "convert pdf pages to jpg"],
    capabilities: { ...LOCAL_CAPABILITIES, multipleFiles: false, supportsPreview: true },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "What do the quality levels mean?",
        a: "Low, Medium and High trade JPEG quality against file size, roughly like a scanner or camera export. Text-heavy pages export as images, not selectable text.",
      },
    ],
    related: ["jpg-to-pdf", "compress", "extract"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/pdf-to-jpg"),
  },
  {
    id: "protect",
    slug: "protect-pdf",
    title: "Protect PDF",
    shortDescription: "Add a password to a PDF",
    metaDescription:
      "Add a password to a PDF so it can't be opened without it. Honest about what protection can and cannot do — all in your browser.",
    longDescription:
      "Add a password that must be entered to open the PDF. Protection is applied with standard PDF encryption, and it's worth knowing the honest limits: passwords deter casual access, but no encryption is absolute, and some PDF readers handle permissions differently.",
    category: "pdf",
    icon: Lock,
    keywords: ["protect pdf", "password protect pdf", "add password to pdf"],
    capabilities: { ...LOCAL_CAPABILITIES, requiresPassword: true, multipleFiles: false },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Is password protection the same as encryption?",
        a: "pdf_love applies standard PDF encryption so the file requires a password to open. No scheme is unbreakable — treat it as a strong deterrent, not an absolute guarantee.",
      },
    ],
    related: ["unlock", "merge", "compress"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/protect"),
  },
  {
    id: "unlock",
    slug: "unlock-pdf",
    title: "Unlock PDF",
    shortDescription: "Remove a password from a PDF you own",
    metaDescription:
      "Remove a known password from a PDF. Browser-based decryption supports common encryption; unsupported methods are detected and explained honestly.",
    longDescription:
      "Remove a password from a PDF you have the rights to. If you know the password, this tool strips it so the file opens without one. Only use this on documents you own or are allowed to modify.",
    category: "pdf",
    icon: Unlock,
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf"],
    capabilities: { ...LOCAL_CAPABILITIES, requiresPassword: true, multipleFiles: false, acceptsEncrypted: true },
    validationRules: SINGLE_PDF,
    privacyMessage: "Processed entirely in your browser",
    faq: [
      {
        q: "Can you unlock any PDF?",
        a: "No. Browser-based tools support common encryption methods. If a PDF uses an unsupported method, we detect it and tell you clearly instead of producing a broken file.",
      },
    ],
    related: ["protect", "merge", "compress"],
    status: "ready",
    loadProcessor: () => import("@/lib/processors/unlock"),
  },
];

export function getToolById(id: string): ToolConfig {
  const tool = tools.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool id: ${id}`);
  return tool;
}

export function getToolBySlug(slug: string): ToolConfig {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

export const readyTools = tools.filter((t) => t.status === "ready");