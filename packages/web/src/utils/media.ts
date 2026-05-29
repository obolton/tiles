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
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface UploadMediaOptions {
  file: File;
  purpose: "content" | "profile";
  workspaceId: string;
}

export interface UploadedMedia {
  id: string;
  width: number;
  height: number;
}

export async function uploadMedia({
  file,
  purpose,
  workspaceId,
}: UploadMediaOptions): Promise<UploadedMedia> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 25 MB limit");
  }

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

  const response = await result.json();
  if (
    typeof response?.id !== "string" ||
    typeof response?.width !== "number" ||
    typeof response?.height !== "number"
  ) {
    throw new Error("Invalid response");
  }
  return {
    id: response.id,
    width: response.width,
    height: response.height,
  };
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
