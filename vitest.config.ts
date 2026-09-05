import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@$/, replacement: new URL("./src", import.meta.url).pathname },
      { find: /^@\//, replacement: `${new URL("./src", import.meta.url).pathname}/` },
      // The browser entry of pdfjs-dist needs a DOM worker; the legacy build
      // runs in Node and is what the test suite (and future CI) uses.
      { find: /^pdfjs-dist$/, replacement: "pdfjs-dist/legacy/build/pdf.mjs" },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});