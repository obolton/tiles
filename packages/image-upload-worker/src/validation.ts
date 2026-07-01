import { BadRequestError, LengthRequiredError, ContentTooLargeError } from "./errors";

export const MAX_CONTENT_LENGTH = 25 * 1024 * 1024; // 25 MB

/**
 * Validates the Content-Length header value.
 */
export function validateContentLength(contentLengthHeader: string | null): void {
  if (!contentLengthHeader) {
    throw new LengthRequiredError();
  }

  const contentLength = parseInt(contentLengthHeader, 10);

  if (Number.isNaN(contentLength) || contentLength <= 0) {
    throw new BadRequestError();
  }

  if (contentLength > MAX_CONTENT_LENGTH) {
    throw new ContentTooLargeError();
  }
}
