import { describe, expect, test } from "vitest";
import { base64ToBytes, bytesToBase64, equalBytes } from "@/encoding";

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

describe("equalBytes", () => {
  test("compares equal arrays as equal", () => {
    expect(equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
  });

  test("compares empty arrays as equal", () => {
    expect(equalBytes(new Uint8Array(), new Uint8Array())).toBe(true);
  });

  test("compares arrays of different lengths as unequal", () => {
    expect(equalBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });

  test("compares same-length arrays with different content as unequal", () => {
    expect(equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
  });

  test("compares by content, not buffer identity", () => {
    const view = new Uint8Array([9, 1, 2, 3]).subarray(1);
    expect(equalBytes(view, new Uint8Array([1, 2, 3]))).toBe(true);
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
