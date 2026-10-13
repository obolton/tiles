import { describe, expect, test } from "vitest";
import { toHex, fromHex } from "../arrays";

describe("toHex", () => {
  test("converts bytes to hex string", () => {
    expect(toHex(new Uint8Array([0xff, 0x80, 0x00]))).toBe("ff8000");
  });
});

describe("fromHex", () => {
  test("converts hex string to bytes", () => {
    expect(fromHex("ff8000")).toEqual(new Uint8Array([0xff, 0x80, 0x00]));
  });
});
