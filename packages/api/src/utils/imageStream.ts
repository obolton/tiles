import { limitBytes } from "@/utils/streams";

// Leading bytes of each supported format; null matches any byte.
const IMAGE_SIGNATURES: Record<string, (number | null)[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/webp": [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
};

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImageError";
  }
}

function matchesSignature(header: Uint8Array, signature: (number | null)[]) {
  return signature.every((byte, index) => byte === null || header[index] === byte);
}

function concat(chunks: Uint8Array[], length: number) {
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/**
 * Errors unless the stream starts with the signature of the declared image type.
 */
export function verifyImageSignature(contentType: string) {
  const signature = IMAGE_SIGNATURES[contentType];
  if (!signature) {
    throw new InvalidImageError(`Unsupported image type: ${contentType}`);
  }

  const pending: Uint8Array[] = [];
  let pendingLength = 0;
  let verified = false;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (verified) {
        controller.enqueue(chunk);
        return;
      }
      pending.push(chunk);
      pendingLength += chunk.byteLength;
      if (pendingLength < signature.length) {
        return;
      }
      const header = concat(pending, pendingLength);
      if (!matchesSignature(header, signature)) {
        controller.error(new InvalidImageError(`Content does not match ${contentType}`));
        return;
      }
      verified = true;
      controller.enqueue(header);
    },
    flush(controller) {
      if (!verified) {
        controller.error(new InvalidImageError(`Content is too short to be ${contentType}`));
      }
    },
  });
}

/**
 * Caps a downloaded image at `maxBytes` and checks its bytes match the declared type.
 */
export function guardImageStream(
  stream: ReadableStream<Uint8Array>,
  contentType: string,
  maxBytes: number,
): ReadableStream<Uint8Array> {
  return stream.pipeThrough(limitBytes(maxBytes)).pipeThrough(verifyImageSignature(contentType));
}
