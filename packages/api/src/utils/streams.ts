import { Buffer } from "node:buffer";

export async function streamToBase64String(stream: ReadableStream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return buffer.toString("base64");
}

export class ByteLimitExceededError extends Error {
  constructor(maxBytes: number) {
    super(`Stream exceeded the limit of ${maxBytes} bytes`);
    this.name = "ByteLimitExceededError";
  }
}

/**
 * Errors (and cancels the source) once more than `maxBytes` have passed through.
 */
export function limitBytes(maxBytes: number) {
  let total = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (total > maxBytes) {
        controller.error(new ByteLimitExceededError(maxBytes));
        return;
      }
      controller.enqueue(chunk);
    },
  });
}
