import { describe, it, expect } from "vitest";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { streamToBase64String } from "../streams.ts";

// Helper function to create a ReadableStream from a string or Buffer
function createTestStream(data: string | Buffer) {
  return Readable.toWeb(Readable.from(data instanceof Buffer ? data : Buffer.from(data)));
}

describe("streamToBase64String", () => {
  it("should convert a stream to a base64 string", async () => {
    const stream = createTestStream("Hello, World!");
    const result = await streamToBase64String(stream);
    expect(result).toBe("SGVsbG8sIFdvcmxkIQ==");
  });

  it("should handle empty input", async () => {
    const stream = createTestStream("");
    const result = await streamToBase64String(stream);
    expect(result).toBe("");
  });

  it("should handle binary data", async () => {
    const binaryData = Buffer.from([0xff, 0x00, 0xff]);
    const stream = createTestStream(binaryData);
    const result = await streamToBase64String(stream);
    expect(result).toBe("/wD/");
  });

  it("should handle large data", async () => {
    const largeData = Buffer.alloc(1024 * 64, "x"); // 64KB of data
    const stream = createTestStream(largeData);
    const result = await streamToBase64String(stream);
    expect(result).toBe(largeData.toString("base64"));
  });
});
