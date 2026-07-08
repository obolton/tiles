/**
 * Decodes a base64-encoded string to a `Uint8Array`.
 *
 * Uses `Uint8Array.fromBase64` when available, falling back to `atob`.
 */
export function base64ToBytes(input: string): Uint8Array {
  if (typeof Uint8Array.fromBase64 === "function") {
    return Uint8Array.fromBase64(input);
  }

  return Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Encodes a `Uint8Array` as a base64 string.
 *
 * Uses `Uint8Array.prototype.toBase64` when available, falling back to `btoa`.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof bytes.toBase64 === "function") {
    return bytes.toBase64();
  }

  let data = "";
  for (const byte of bytes) {
    data += String.fromCharCode(byte);
  }
  return btoa(data);
}
