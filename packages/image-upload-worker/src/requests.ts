import { parse } from "cookie";
import {
  BadRequestError,
  UnauthorizedError,
  MethodNotAllowedError,
  UnsupportedMediaTypeError,
} from "./errors";
import { validateContentLength } from "./validation";

const SESSION_COOKIE_NAME = "__Secure-session";

export type ImagePurpose = "CONTENT" | "PROFILE";
export type ImageType = "PNG" | "JPEG" | "GIF" | "WEBP";

export interface UploadParams {
  sessionId: string;
  workspaceId: string;
  purpose: ImagePurpose;
  type: ImageType;
}

function parsePurpose(purpose: string | null): ImagePurpose {
  switch (purpose?.toLowerCase()) {
    case "content":
      return "CONTENT";
    case "profile":
      return "PROFILE";
    default:
      throw new BadRequestError("Invalid purpose");
  }
}

function parseImageType(contentType: string | null): ImageType {
  switch (contentType?.toLowerCase()) {
    case "image/png":
      return "PNG";
    case "image/jpeg":
      return "JPEG";
    case "image/gif":
      return "GIF";
    case "image/webp":
      return "WEBP";
    default:
      throw new UnsupportedMediaTypeError();
  }
}

/**
 * Parses and validates an upload request.
 * Throws an HttpError if validation fails.
 */
export function parseUploadRequest(request: Request): UploadParams {
  if (request.method !== "PUT") {
    throw new MethodNotAllowedError();
  }

  validateContentLength(request.headers.get("Content-Length"));

  const cookies = parse(request.headers.get("Cookie") || "");
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) {
    throw new UnauthorizedError();
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    throw new BadRequestError("Invalid workspace ID");
  }

  const purpose = parsePurpose(url.searchParams.get("purpose"));
  const type = parseImageType(request.headers.get("Content-Type"));

  return { sessionId, workspaceId, purpose, type };
}
