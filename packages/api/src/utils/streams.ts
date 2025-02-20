import { Buffer } from "node:buffer";

export async function streamToBase64String(stream: ReadableStream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return buffer.toString("base64");
}
