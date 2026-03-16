import { user } from "@/utils/sessions";

export const ACCEPT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
export const ACCEPT_CONTENT_TYPES = new Set(["text/uri-list"]).union(
  ACCEPT_IMAGE_TYPES,
);
export const UPLOAD_ORIGIN = import.meta.env.PUBLIC_UPLOAD_ORIGIN;

export interface UploadMediaOptions {
  file: File;
  purpose: "content" | "profile";
  workspaceId: string;
}

export async function uploadMedia({
  file,
  purpose,
  workspaceId,
}: UploadMediaOptions) {
  const userId = user.value?.id;
  if (!userId) {
    throw new Error("Not signed in");
  }

  const url = new URL(UPLOAD_ORIGIN);
  url.searchParams.set("workspaceId", workspaceId);
  url.searchParams.set("purpose", purpose);

  const result = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
    credentials: "include",
  });

  if (!result.ok) {
    throw new Error(`Upload failed: ${result.statusText}`);
  }

  // TODO: Validate
  const response = await result.json();
  return response.id;
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

// TODO: Fix memory leak here
export async function preloadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve());
    image.addEventListener("error", reject);
    image.fetchPriority = "high";
    image.src = url;
  });
}
