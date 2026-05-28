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
