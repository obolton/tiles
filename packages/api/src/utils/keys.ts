import crypto from "node:crypto";

export async function createKey(bytes: number) {
  if (bytes < 16) {
    throw new Error("Invalid key length");
  }

  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(bytes, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer.toString("base64url"));
      }
    });
  });
}
