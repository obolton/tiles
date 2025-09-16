import client from "@/api/client";
import { user } from "@/utils/sessions";

export const ACCEPT_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
export const ACCEPT_CONTENT_TYPES = new Set(["text/uri-list"]).union(
  ACCEPT_IMAGE_TYPES,
);

export interface UploadMediaOptions {
  file: File;
  type: "image" | "profile-image";
  workspaceId: string;
}

export async function uploadMedia({
  file,
  type,
  workspaceId,
}: UploadMediaOptions) {
  const userId = user.value?.id;
  if (!userId) {
    throw new Error("Not signed in");
  }

  const { url, key } = await client.media.createUploadUrl.mutate({
    type,
    workspaceId,
  });
  const uploadResult = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
      "x-amz-meta-workspace": workspaceId,
      "x-amz-meta-user": userId,
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

export async function preloadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve());
    image.addEventListener("error", reject);
    image.fetchPriority = "high";
    image.src = url;
  });
}
