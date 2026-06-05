import { describe, expect, test } from "vitest";
import { base64ToBytes, bytesToBase64 } from "@/encoding";

describe("base64ToBytes", () => {
  test("decodes an empty string", () => {
    expect(base64ToBytes("")).toEqual(new Uint8Array());
  });

  test("decodes base64-encoded data", () => {
    // [0, 1, 254, 255]
    expect(Array.from(base64ToBytes("AAH+/w=="))).toEqual([0, 1, 254, 255]);
  });

  test("round-trips a string", () => {
    const source = "The quick brown fox jumps over the lazy dog";
    const decoded = String.fromCharCode(...base64ToBytes(btoa(source)));
    expect(decoded).toBe(source);
  });
});

describe("bytesToBase64", () => {
  test("encodes an empty array", () => {
    expect(bytesToBase64(new Uint8Array())).toBe("");
  });

  test("encodes bytes", () => {
    expect(bytesToBase64(new Uint8Array([0, 1, 254, 255]))).toBe("AAH+/w==");
  });

  test("round-trips bytes", () => {
    const bytes = new Uint8Array([10, 0, 200, 42, 255, 1, 128]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});
