import { describe, test, expect } from "vitest";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { streamToBase64String } from "../streams";

// Helper function to create a ReadableStream from a string or Buffer
function createTestStream(data: string | Buffer) {
  return Readable.toWeb(Readable.from(data instanceof Buffer ? data : Buffer.from(data)));
}

describe("streamToBase64String", () => {
  test("converts a stream to a base64 string", async () => {
    const stream = createTestStream("Hello, World!");
    const result = await streamToBase64String(stream);
    expect(result).toBe("SGVsbG8sIFdvcmxkIQ==");
  });

  test("handles empty input", async () => {
    const stream = createTestStream("");
    const result = await streamToBase64String(stream);
    expect(result).toBe("");
  });

  test("handles binary data", async () => {
    const binaryData = Buffer.from([0xff, 0x00, 0xff]);
    const stream = createTestStream(binaryData);
    const result = await streamToBase64String(stream);
    expect(result).toBe("/wD/");
  });

  test("handles large data", async () => {
    const largeData = Buffer.alloc(1024 * 64, "x"); // 64KB of data
    const stream = createTestStream(largeData);
    const result = await streamToBase64String(stream);
    expect(result).toBe(largeData.toString("base64"));
  });
});
