import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/database/prisma";
import { upload, IMAGES_BUCKET } from "@/utils/storage";
import { fetchImage } from "../fetchImage.ts";

vi.mock("@/utils/storage", () => ({
  upload: vi.fn(),
  IMAGES_BUCKET: "test-bucket",
}));

const WORKSPACE_ID = "workspace-1";
const USER_ID = "user-1";

function imageResponse(
  contentType = "image/jpeg",
  { status = 200, contentLength }: { status?: number; contentLength?: string } = {},
) {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (contentLength) {
    headers["Content-Length"] = contentLength;
  }
  return new Response(new Uint8Array([0xff, 0xd8]), { status, headers });
}

describe("fetchImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("downloads image, uploads to R2, and creates database record", async () => {
    const response = imageResponse();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

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
      vi.restoreAllMocks();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse(contentType));

      await fetchImage("https://example.com/img", WORKSPACE_ID, USER_ID);

      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: imageType }),
      });
    }
  });

  test("handles content type with charset parameter", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("image/png; charset=utf-8"));

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
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("image/jpeg", { status: 404 }));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/missing.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects invalid content types", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("text/html"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/page.html", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects SVG images", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("image/svg+xml"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/logo.svg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("rejects images exceeding size limit", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        imageResponse("image/jpeg", { contentLength: "10000000" }),
      );
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/huge.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    });

    test("allows images within size limit", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        imageResponse("image/jpeg", { contentLength: "1000" }),
      );

      const result = await fetchImage("https://example.com/small.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeTypeOf("string");
    });

    test("returns null when response has no body", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
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
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    test("returns null on upload failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse());
      vi.mocked(upload).mockRejectedValue(new Error("R2 upload failed"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    test("returns null on database failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse());
      vi.mocked(prisma.image.create).mockRejectedValue(new Error("DB error"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await fetchImage("https://example.com/image.jpg", WORKSPACE_ID, USER_ID);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
