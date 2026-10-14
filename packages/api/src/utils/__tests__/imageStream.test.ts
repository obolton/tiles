import { describe, expect, test } from "vitest";
import { imageBytes } from "@/test/mocks/fetch";
import { guardImageStream, verifyImageSignature } from "../imageStream";

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

function readAll(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).bytes();
}

describe("verifyImageSignature", () => {
  test.each(["image/jpeg", "image/png", "image/gif", "image/webp"])(
    "passes a valid %s through unchanged",
    async (contentType) => {
      const bytes = imageBytes(contentType);
      const output = await readAll(streamOf(bytes).pipeThrough(verifyImageSignature(contentType)));
      expect(output).toEqual(bytes);
    },
  );

  test("verifies a signature that arrives split across chunks", async () => {
    const bytes = imageBytes("image/webp");
    const stream = streamOf(bytes.slice(0, 2), bytes.slice(2, 9), bytes.slice(9));

    const output = await readAll(stream.pipeThrough(verifyImageSignature("image/webp")));

    expect(output).toEqual(bytes);
  });

  test("rejects content whose bytes do not match the declared type", async () => {
    const stream = streamOf(imageBytes("image/png"));

    await expect(readAll(stream.pipeThrough(verifyImageSignature("image/jpeg")))).rejects.toThrow(
      "Content does not match image/jpeg",
    );
  });

  test("rejects HTML served as an image", async () => {
    const stream = streamOf(new TextEncoder().encode("<!doctype html><html></html>"));

    await expect(readAll(stream.pipeThrough(verifyImageSignature("image/png")))).rejects.toThrow(
      "Content does not match image/png",
    );
  });

  test("rejects content shorter than the signature", async () => {
    const stream = streamOf(new Uint8Array([0xff, 0xd8]));

    await expect(readAll(stream.pipeThrough(verifyImageSignature("image/jpeg")))).rejects.toThrow(
      "too short",
    );
  });

  test("rejects empty content", async () => {
    await expect(
      readAll(streamOf().pipeThrough(verifyImageSignature("image/gif"))),
    ).rejects.toThrow("too short");
  });

  test("throws for unsupported content types", () => {
    expect(() => verifyImageSignature("image/svg+xml")).toThrow("Unsupported image type");
  });
});

describe("guardImageStream", () => {
  test("passes a valid image within the size limit", async () => {
    const bytes = imageBytes("image/png");

    const output = await readAll(guardImageStream(streamOf(bytes), "image/png", 1024));

    expect(output).toEqual(bytes);
  });

  test("aborts an image that exceeds the size limit", async () => {
    const bytes = imageBytes("image/png");
    const stream = streamOf(bytes, new Uint8Array(100));

    await expect(readAll(guardImageStream(stream, "image/png", 50))).rejects.toThrow(
      "exceeded the limit of 50 bytes",
    );
  });

  test("cancels the source when the limit is exceeded", async () => {
    let cancelled = false;
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(imageBytes("image/png"));
      },
      pull(controller) {
        controller.enqueue(new Uint8Array(1024));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(readAll(guardImageStream(source, "image/png", 2048))).rejects.toThrow(
      "exceeded the limit",
    );
    expect(cancelled).toBe(true);
  });
});
