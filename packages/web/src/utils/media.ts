import client from "../api/client";

export async function uploadMedia(file: File) {
  const { url, key } = await client.media.createSignedUploadUrl.mutate();
  const uploadResult = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
  if (!uploadResult.ok) {
    throw new Error(`Upload failed: ${uploadResult.statusText}`);
  }
  return key;
}
