import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/database/prisma";
import { upload, IMAGES_BUCKET } from "@/utils/storage";
import { imageResponse } from "@/test/mocks/fetch";
import { fetchImage } from "../fetchImage";

vi.mock("@/utils/storage", () => ({
  upload: vi.fn(),
  IMAGES_BUCKET: "test-bucket",
}));

const WORKSPACE_ID = "workspace-1";
const USER_ID = "user-1";

describe("fetchImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("downloads image, uploads to R2, and creates database record", async () => {
    const response = imageResponse();
    vi.mocked(fetch).mockResolvedValue(response);

    const imageId = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

    expect(imageId).toBeTypeOf("string");
    expect(upload).toHaveBeenCalledWith(IMAGES_BUCKET, imageId, expect.anything(), "image/jpeg");
    expect(prisma.image.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: imageId,
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        source: "EXTERNAL_LINK",
        purpose: "CONTENT",
        type: "JPEG",
        pending: false,
      }),
    });
  });

  test("maps content types to correct image types", async () => {
    const types = [
      ["image/png", "PNG"],
      ["image/gif", "GIF"],
      ["image/webp", "WEBP"],
      ["image/jpeg", "JPEG"],
    ] as const;

    for (const [contentType, imageType] of types) {
      vi.clearAllMocks();
      vi.mocked(fetch).mockResolvedValue(imageResponse(contentType));

      await fetchImage("https://example.com/img", WORKSPACE_ID, USER_ID);

      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: imageType }),
      });
    }
  });

  test("handles content type with charset parameter", async () => {
    vi.mocked(fetch).mockResolvedValue(imageResponse("image/png; charset=utf-8"));

    const imageId = await fetchImage("https://example.com/img.png", WORKSPACE_ID, USER_ID);

    expect(imageId).toBeTypeOf("string");
    expect(upload).toHaveBeenCalledWith(IMAGES_BUCKET, imageId, expect.anything(), "image/png");
  });

  describe("URL validation", () => {
    test("rejects non-http/https protocols", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("ftp://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects invalid URLs", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("not-a-url", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("response validation", () => {
    test("returns null on non-OK response", async () => {
      vi.mocked(fetch).mockResolvedValue(imageResponse("image/jpeg", { status: 404 }));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/missing.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects invalid content types", async () => {
      vi.mocked(fetch).mockResolvedValue(imageResponse("text/html"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/page.html", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects SVG images", async () => {
      vi.mocked(fetch).mockResolvedValue(imageResponse("image/svg+xml"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/logo.svg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects images exceeding size limit", async () => {
      vi.mocked(fetch).mockResolvedValue(
        imageResponse("image/jpeg", { contentLength: "10000000" }),
      );
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/huge.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("allows images within size limit", async () => {
      vi.mocked(fetch).mockResolvedValue(imageResponse("image/jpeg", { contentLength: "1000" }));

      const result = await fetchImage("https://example.com/small.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeTypeOf("string");
    });

    test("returns null when response has no body", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      );
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/empty.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("returns null on fetch failure", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    test("returns null on upload failure", async () => {
      vi.mocked(fetch).mockResolvedValue(imageResponse());
      vi.mocked(upload).mockRejectedValue(new Error("R2 upload failed"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    test("returns null on database failure", async () => {
      vi.mocked(fetch).mockResolvedValue(imageResponse());
      vi.mocked(prisma.image.create).mockRejectedValue(new Error("DB error"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
