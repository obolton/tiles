import { describe, expect, test, vi } from "vitest";
import crypto from "node:crypto";
import { createKey } from "../keys";

describe("createKey", () => {
  test("creates a valid base64url string with the expected length", async () => {
    const key16 = await createKey(16);
    expect(key16).toMatch(/^[A-Za-z0-9_-]{22}$/); // 16 bytes in base64url is 22 characters

    const key32 = await createKey(32);
    expect(key32).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes in base64url is 43 characters
  });

  test("rejects if the random byte generation fails", async () => {
    const error = new Error("Random bytes generation failed");
    const spy = vi.spyOn(crypto, "randomBytes").mockImplementation((_, callback) => {
      callback(error, Buffer.from(""));
    });
    await expect(createKey(16)).rejects.toThrow(error.message);
    spy.mockRestore();
  });

  test("rejects if the key is less than 16 bytes", async () => {
    await expect(createKey(15)).rejects.toThrow("Invalid key length");
  });
});
