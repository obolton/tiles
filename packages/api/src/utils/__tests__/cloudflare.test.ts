import { afterEach, describe, expect, test, vi } from "vitest";
import { purgeCache } from "../cloudflare";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("purgeCache", () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  test("posts the purge request to the zone endpoint", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await purgeCache({ files: ["https://example.com/a"] });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/zones/test/purge_cache",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: ["https://example.com/a"] }),
      },
    );
  });

  test("maps purgeEverything to the API field name", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await purgeCache({ purgeEverything: true });

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ purge_everything: true }));
  });

  test("throws when the request fails", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 403 }));

    await expect(purgeCache({ purgeEverything: true })).rejects.toThrow(
      "Cloudflare cache purge failed: 403 nope",
    );
  });
});
