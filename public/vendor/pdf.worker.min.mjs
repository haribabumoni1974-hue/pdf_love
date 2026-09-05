// pdf.js worker wrapper (pdfjs-dist v6).
//
// pdfjs-dist v6 uses the native ES2025 Uint8Array hex/base64 methods, which
// engines like Chrome < 136 don't provide. This wrapper installs spec-shaped
// shims in the worker's global *before* the real worker module runs, then
// loads it. Keep this shim in sync with src/lib/pdf/uint8array-polyfill.ts,
// and pdf.worker.core.mjs in sync with the pdfjs-dist version in package.json.

const U8 = globalThis.Uint8Array;

if (U8) {
  if (typeof U8.prototype.toHex !== "function") {
    Object.defineProperty(U8.prototype, "toHex", {
      configurable: true,
      writable: true,
      value: function toHex() {
        const out = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
          const hex = this[i].toString(16);
          out[i] = hex.length === 1 ? "0" + hex : hex;
        }
        return out.join("");
      },
    });
  }

  if (typeof U8.prototype.fromHex !== "function") {
    Object.defineProperty(U8.prototype, "fromHex", {
      configurable: true,
      writable: true,
      value: function fromHex(hex) {
        if (typeof hex !== "string") throw new TypeError("hex must be a string");
        if (hex.length % 2 !== 0) throw new SyntaxError("hex string must have an even length");
        const out = new Uint8Array(hex.length / 2);
        for (let i = 0; i < out.length; i++) {
          const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
          if (Number.isNaN(byte)) throw new SyntaxError("string contains non-hexadecimal characters");
          out[i] = byte;
        }
        return out;
      },
    });
  }

  if (typeof U8.prototype.toBase64 !== "function") {
    Object.defineProperty(U8.prototype, "toBase64", {
      configurable: true,
      writable: true,
      value: function toBase64() {
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < this.length; i += chunk) {
          binary += String.fromCharCode.apply(null, this.subarray(i, i + chunk));
        }
        return btoa(binary);
      },
    });
  }

  if (typeof U8.fromBase64 !== "function") {
    Object.defineProperty(U8, "fromBase64", {
      configurable: true,
      writable: true,
      value: function fromBase64(base64) {
        if (typeof base64 !== "string") throw new TypeError("base64 must be a string");
        const clean = base64.replace(/-/g, "+").replace(/_/g, "/");
        const binary = atob(clean);
        const out = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
        return out;
      },
    });
  }
}

await import("./pdf.worker.core.mjs");
