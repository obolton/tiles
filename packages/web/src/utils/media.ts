import client from "@/api/client";

export const ACCEPT_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
export const ACCEPT_CONTENT_TYPES = new Set(["text/uri-list"]).union(
  ACCEPT_IMAGE_TYPES,
);

export async function uploadMedia(file: File, type: "image" | "profile-image") {
  const { url, key } = await client.media.createSignedUploadUrl.mutate(type);
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

export function getAcceptableDragItem(
  dataTransfer: DataTransfer,
  contentTypes = ACCEPT_CONTENT_TYPES,
) {
  if (!dataTransfer.items) {
    return undefined;
  }
  return Array.from(dataTransfer.items).find((item) =>
    contentTypes.has(item.type),
  );
}

export function isImage(item: DataTransferItem) {
  return ACCEPT_IMAGE_TYPES.has(item.type);
}

export function isUriList(item: DataTransferItem) {
  return item.type === "text/uri-list";
}
