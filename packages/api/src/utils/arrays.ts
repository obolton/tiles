import { Buffer } from "node:buffer";

export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(hex, "hex"));
}
