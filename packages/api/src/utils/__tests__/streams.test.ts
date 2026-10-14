import { describe, test, expect } from "vitest";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { limitBytes, streamToBase64String } from "../streams";

// Helper function to create a ReadableStream from a string or Buffer
function createTestStream(data: string | Buffer) {
  return Readable.toWeb(Readable.from(data instanceof Buffer ? data : Buffer.from(data)));
}

describe("streamToBase64String", () => {
  test("should convert a stream to a base64 string", async () => {
    const stream = createTestStream("Hello, World!");
    const result = await streamToBase64String(stream);
    expect(result).toBe("SGVsbG8sIFdvcmxkIQ==");
  });

  test("should handle empty input", async () => {
    const stream = createTestStream("");
    const result = await streamToBase64String(stream);
    expect(result).toBe("");
  });

  test("should handle binary data", async () => {
    const binaryData = Buffer.from([0xff, 0x00, 0xff]);
    const stream = createTestStream(binaryData);
    const result = await streamToBase64String(stream);
    expect(result).toBe("/wD/");
  });

  test("should handle large data", async () => {
    const largeData = Buffer.alloc(1024 * 64, "x"); // 64KB of data
    const stream = createTestStream(largeData);
    const result = await streamToBase64String(stream);
    expect(result).toBe(largeData.toString("base64"));
  });
});

function streamOf(...chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

describe("limitBytes", () => {
  test("passes streams within the limit through unchanged", async () => {
    const stream = streamOf(new Uint8Array([1, 2]), new Uint8Array([3]));

    const output = await new Response(stream.pipeThrough(limitBytes(3))).bytes();

    expect(output).toEqual(new Uint8Array([1, 2, 3]));
  });

  test("errors once the limit is exceeded", async () => {
    const stream = streamOf(new Uint8Array([1, 2]), new Uint8Array([3, 4]));

    await expect(new Response(stream.pipeThrough(limitBytes(3))).bytes()).rejects.toThrow(
      "Stream exceeded the limit of 3 bytes",
    );
  });
});
