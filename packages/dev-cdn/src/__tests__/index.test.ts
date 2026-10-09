import { beforeEach, describe, expect, test, vi } from "vitest";
import handler from "../index";

const get = vi.fn();

const bucket: R2Bucket = {
  get,
  put: vi.fn(),
  delete: vi.fn(),
  head: vi.fn(),
  list: vi.fn(),
  createMultipartUpload: vi.fn(),
  resumeMultipartUpload: vi.fn(),
};

const env = { IMAGES: bucket } as Env;

const ORIGIN = "https://cdn.example.com";
const IMAGE_URL = `${ORIGIN}/images/abc`;
const ETAG = '"abc123"';

function createObject(body?: string) {
  return {
    httpEtag: ETAG,
    writeHttpMetadata: vi.fn((headers: Headers) => {
      headers.set("Content-Type", "image/png");
    }),
    ...(body === undefined ? {} : { body: new Blob([body]).stream() }),
  };
}

describe("fetch handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue(createObject("image-bytes"));
  });

  test("rejects methods other than GET and HEAD", async () => {
    const response = await handler.fetch(new Request(IMAGE_URL, { method: "PUT" }), env);

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
    expect(get).not.toHaveBeenCalled();
  });

  test("returns 404 for an unknown bucket", async () => {
    const response = await handler.fetch(new Request(`${ORIGIN}/other/abc`), env);

    expect(response.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  test.each(["/", "/images", "/images/"])("returns 404 for a missing key (%s)", async (path) => {
    const response = await handler.fetch(new Request(`${ORIGIN}${path}`), env);

    expect(response.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  test("returns 404 when the object does not exist", async () => {
    get.mockResolvedValue(null);

    const response = await handler.fetch(new Request(`${ORIGIN}/images/missing`), env);

    expect(response.status).toBe(404);
    expect(get).toHaveBeenCalledWith("missing", expect.anything());
  });

  test("streams the object with its HTTP metadata and ETag", async () => {
    const response = await handler.fetch(new Request(IMAGE_URL), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("ETag")).toBe(ETAG);
    await expect(response.text()).resolves.toBe("image-bytes");
  });

  test("ignores query parameters", async () => {
    await handler.fetch(new Request(`${IMAGE_URL}?optimizer=image&class=large`), env);

    expect(get).toHaveBeenCalledWith("abc", expect.anything());
  });

  test("preserves slashes in nested keys", async () => {
    await handler.fetch(new Request(`${ORIGIN}/images/a/b.png`), env);

    expect(get).toHaveBeenCalledWith("a/b.png", expect.anything());
  });

  test("passes request headers as preconditions", async () => {
    await handler.fetch(new Request(IMAGE_URL, { headers: { "If-None-Match": ETAG } }), env);

    const options = get.mock.calls[0]?.[1];
    expect(options.onlyIf).toBeInstanceOf(Headers);
    expect(options.onlyIf.get("If-None-Match")).toBe(ETAG);
  });

  test("returns 304 when a precondition fails", async () => {
    get.mockResolvedValue(createObject());

    const response = await handler.fetch(
      new Request(IMAGE_URL, { headers: { "If-None-Match": ETAG } }),
      env,
    );

    expect(response.status).toBe(304);
    expect(response.headers.get("ETag")).toBe(ETAG);
    expect(response.body).toBeNull();
  });

  test("returns headers without a body for HEAD requests", async () => {
    const response = await handler.fetch(new Request(IMAGE_URL, { method: "HEAD" }), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.body).toBeNull();
  });
});
