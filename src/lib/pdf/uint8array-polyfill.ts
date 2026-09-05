/**
 * pdfjs-dist v6 relies on ES2024/ES2025 Uint8Array base64/hex methods that
 * older engines (e.g. Chrome < 136) don't ship natively. Install spec-shaped
 * shims only where the native methods are missing, before any pdf.js code
 * runs. The same shim is embedded in the served worker asset
 * (public/vendor/pdf.worker.min.mjs) because workers have their own global.
 */

// The methods are not in every TS lib version yet — type them as optional.
interface PolyfilledUint8Array extends Uint8Array {
  toHex?: () => string;
  fromHex?: (hex: string) => Uint8Array;
  toBase64?: () => string;
}
interface PolyfilledUint8ArrayConstructor extends Uint8ArrayConstructor {
  fromBase64?: (base64: string) => Uint8Array;
}

function install(Ctor: PolyfilledUint8ArrayConstructor | undefined) {
  if (!Ctor) return;
  const proto = Ctor.prototype as PolyfilledUint8Array;

  if (typeof proto.toHex !== "function") {
    Object.defineProperty(proto, "toHex", {
      configurable: true,
      writable: true,
      value(this: Uint8Array): string {
        const out = new Array<string>(this.length);
        for (let i = 0; i < this.length; i++) {
          const hex = this[i].toString(16);
          out[i] = hex.length === 1 ? `0${hex}` : hex;
        }
        return out.join("");
      },
    });
  }

  if (typeof proto.fromHex !== "function") {
    Object.defineProperty(proto, "fromHex", {
      configurable: true,
      writable: true,
      value(this: Uint8Array, hex: string): Uint8Array {
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

  if (typeof proto.toBase64 !== "function") {
    Object.defineProperty(proto, "toBase64", {
      configurable: true,
      writable: true,
      value(this: Uint8Array): string {
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < this.length; i += chunk) {
          binary += String.fromCharCode(...this.subarray(i, i + chunk));
        }
        return btoa(binary);
      },
    });
  }

  if (typeof Ctor.fromBase64 !== "function") {
    Object.defineProperty(Ctor, "fromBase64", {
      configurable: true,
      writable: true,
      value(base64: string): Uint8Array {
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

install(globalThis.Uint8Array as PolyfilledUint8ArrayConstructor | undefined);
