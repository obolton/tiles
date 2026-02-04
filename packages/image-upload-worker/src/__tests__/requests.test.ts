import { describe, expect, test } from "vitest";
import { parseUploadRequest } from "../requests";
import {
  BadRequestError,
  UnauthorizedError,
  MethodNotAllowedError,
  UnsupportedMediaTypeError,
} from "../errors";

const URL = "https://example.com/upload?workspaceId=ws-123&purpose=content";

const HEADERS = {
  "Content-Type": "image/png",
  "Content-Length": "1024",
  Cookie: "__Secure-session=test-session-id",
};

describe("parseUploadRequest", () => {
  describe("method validation", () => {
    test("throws MethodNotAllowedError for GET requests", () => {
      const request = new Request(URL, {
        method: "GET",
        headers: HEADERS,
      });

      expect(() => parseUploadRequest(request)).toThrow(MethodNotAllowedError);
    });

    test("throws MethodNotAllowedError for POST requests", () => {
      const request = new Request(URL, {
        method: "POST",
        headers: HEADERS,
      });

      expect(() => parseUploadRequest(request)).toThrow(MethodNotAllowedError);
    });
  });

  describe("authentication", () => {
    test("throws UnauthorizedError when session cookie is missing", () => {
      const request = new Request(URL, {
        method: "PUT",
        headers: {
          "Content-Type": "image/png",
          "Content-Length": "1024",
        },
      });

      expect(() => parseUploadRequest(request)).toThrow(UnauthorizedError);
    });

    test("extracts session ID from cookie", () => {
      const request = new Request(URL, {
        method: "PUT",
        headers: HEADERS,
      });

      const params = parseUploadRequest(request);

      expect(params.sessionId).toBe("test-session-id");
    });
  });

  describe("workspace ID", () => {
    test("throws BadRequestError when workspaceId is missing", () => {
      const request = new Request(
        "https://example.com/upload?purpose=content",
        {
          method: "PUT",
          headers: HEADERS,
        },
      );

      expect(() => parseUploadRequest(request)).toThrow(BadRequestError);
    });

    test("extracts workspaceId from query params", () => {
      const request = new Request(URL, {
        method: "PUT",
        headers: HEADERS,
      });

      const params = parseUploadRequest(request);

      expect(params.workspaceId).toBe("ws-123");
    });
  });

  describe("purpose", () => {
    test("throws BadRequestError when purpose is missing", () => {
      const request = new Request(
        "https://example.com/upload?workspaceId=ws-123",
        {
          method: "PUT",
          headers: HEADERS,
        },
      );

      expect(() => parseUploadRequest(request)).toThrow(BadRequestError);
    });

    test("throws BadRequestError for invalid purpose", () => {
      const request = new Request(
        "https://example.com/upload?workspaceId=ws-123&purpose=invalid",
        {
          method: "PUT",
          headers: HEADERS,
        },
      );

      expect(() => parseUploadRequest(request)).toThrow(BadRequestError);
    });

    test("parses content purpose", () => {
      const request = new Request(URL, {
        method: "PUT",
        headers: HEADERS,
      });

      const params = parseUploadRequest(request);

      expect(params.purpose).toBe("CONTENT");
    });

    test("parses profile purpose", () => {
      const request = new Request(
        "https://example.com/upload?workspaceId=ws-123&purpose=profile",
        {
          method: "PUT",
          headers: HEADERS,
        },
      );

      const params = parseUploadRequest(request);

      expect(params.purpose).toBe("PROFILE");
    });
  });

  describe("content type", () => {
    test("throws UnsupportedMediaTypeError when Content-Type is missing", () => {
      const request = new Request(URL, {
        method: "PUT",
        headers: {
          "Content-Length": "1024",
          Cookie: "__Secure-session=test-session-id",
        },
      });

      expect(() => parseUploadRequest(request)).toThrow(
        UnsupportedMediaTypeError,
      );
    });

    test("throws UnsupportedMediaTypeError for unsupported content type", () => {
      const request = new Request(URL, {
        method: "PUT",
        headers: {
          ...HEADERS,
          "Content-Type": "text/plain",
        },
      });

      expect(() => parseUploadRequest(request)).toThrow(
        UnsupportedMediaTypeError,
      );
    });

    test.each([
      ["image/png", "PNG"],
      ["image/jpeg", "JPEG"],
      ["image/gif", "GIF"],
      ["image/webp", "WEBP"],
    ])("parses %s as %s", (contentType, expectedType) => {
      const request = new Request(URL, {
        method: "PUT",
        headers: {
          ...HEADERS,
          "Content-Type": contentType,
        },
      });

      const params = parseUploadRequest(request);

      expect(params.type).toBe(expectedType);
    });
  });
});
