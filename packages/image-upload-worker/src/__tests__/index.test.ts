import { describe, expect, test, vi, beforeEach } from "vitest";
import { createClient } from "../client";
import { uploadImage } from "../upload";
import handler from "../index";

vi.mock("../client", () => ({
  createClient: vi.fn(),
}));

vi.mock("../upload", () => ({
  uploadImage: vi.fn(),
}));

const URL = "https://example.com/upload?workspaceId=ws-123&purpose=content";

const HEADERS = {
  "Content-Type": "image/png",
  "Content-Length": "1024",
  Cookie: "__Secure-session=test-session",
};

const env = { IMAGES: {} } as Env;

describe("fetch handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns preflight response for OPTIONS requests", async () => {
    const request: Request<unknown, IncomingRequestCfProperties> = new Request(URL, {
      method: "OPTIONS",
    });

    const response = await handler.fetch(request, env);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("PUT");
  });

  test("returns JSON response with image data on success", async () => {
    const request: Request<unknown, IncomingRequestCfProperties> = new Request(URL, {
      method: "PUT",
      headers: HEADERS,
    });
    const image = { id: "img-123", width: 300, height: 400 };

    vi.mocked(createClient).mockReturnValue({} as never);
    vi.mocked(uploadImage).mockResolvedValue(image);

    const response = await handler.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(image);
  });

  test("returns JSON error response for HttpError", async () => {
    const request: Request<unknown, IncomingRequestCfProperties> = new Request(URL, {
      method: "PUT",
      headers: {
        ...HEADERS,
        Cookie: "",
      },
    });

    const response = await handler.fetch(request, env);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  test("returns 500 error for unknown errors", async () => {
    const request: Request<unknown, IncomingRequestCfProperties> = new Request(URL, {
      method: "PUT",
      headers: HEADERS,
    });

    vi.mocked(createClient).mockReturnValue({} as never);
    vi.mocked(uploadImage).mockRejectedValue(new Error("Unexpected error"));

    const response = await handler.fetch(request, env);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Server Error" });
  });
});
