import { chromium, type Browser, type Page } from "playwright-core";
import { ToolError } from "@/lib/processing/errors";

/**
 * Headless-browser printing for server-side conversions (DOCX/XLSX/HTML → PDF).
 *
 * Security model:
 *  - A fresh browser page per job, JavaScript disabled.
 *  - All external network requests are blocked (http/https); only data: URLs
 *    and inline content are allowed. No local files, no internal networks,
 *    no secrets — uploaded HTML can never fetch them.
 *  - Content is injected via setContent (never loaded from a URL the user
 *    controls), so there is no SSRF vector.
 *  - The browser is launched with our own installed Chrome/Edge (channel or
 *    explicit executablePath) — never with a shell command built from input.
 */

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

let browserPromise: Promise<Browser> | null = null;
let browser: Browser | null = null;

async function launch(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;
  browserPromise = (async () => {
    const attempts: Parameters<typeof chromium.launch>[0][] = [
      { channel: "msedge", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      { channel: "chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      ...EDGE_PATHS.map((executablePath) => ({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })),
      ...CHROME_PATHS.map((executablePath) => ({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })),
    ];
    for (const opts of attempts) {
      try {
        const b = await chromium.launch(opts as Parameters<typeof chromium.launch>[0]);
        return b;
      } catch {
        /* try next */
      }
    }
    throw new ToolError(
      "No compatible browser was found for conversion on this server. The conversion engine requires a local Chrome or Edge installation.",
    );
  })();
  browser = await browserPromise;
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => undefined);
    browser = null;
    browserPromise = null;
  }
}

export interface PrintHtmlOptions {
  onProgress?: (m: string) => void;
}

/**
 * Render an HTML string to a printable PDF. JS off, external resources
 * blocked. Returns the PDF blob and any resource-block warnings observed.
 */
export async function htmlToPdf(html: string, opts: PrintHtmlOptions = {}): Promise<{ blob: Blob; blockedExternal: string[] }> {
  const b = await launch();
  const context = await b.newContext({ javaScriptEnabled: false });
  const page: Page = await context.newPage();
  const blockedExternal: string[] = [];
  try {
    // Block every network request; allow only inline data: resources.
    await page.route("**/*", (route) => {
      const req = route.request();
      const url = req.url();
      if (url.startsWith("data:")) {
        return route.continue();
      }
      blockedExternal.push(url);
      return route.abort();
    });
    opts.onProgress?.("Rendering the document…");
    await page.setContent(html, { waitUntil: "load", timeout: 20_000 });
    await page.emulateMedia({ media: "print" });
    const pdfBase64 = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0.6in", bottom: "0.6in", left: "0.6in", right: "0.6in" },
    });
    const bytes = Buffer.from(pdfBase64);
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      blockedExternal: [...new Set(blockedExternal)].slice(0, 5),
    };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new ToolError("The conversion engine timed out while rendering this document.");
    }
    throw new ToolError(
      `The document could not be rendered to PDF. It may contain content the conversion engine cannot handle.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  } finally {
    await context.close().catch(() => undefined);
  }
}