import { Buffer } from "node:buffer";

// TODO: Use `Uint8Array.prototype.toHex` when available
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toHex
export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

// TODO: Use `Uint8Array.fromHex` when available
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromHex
export function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(hex, "hex"));
}
