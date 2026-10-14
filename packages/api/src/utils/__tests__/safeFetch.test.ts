import { beforeEach, describe, expect, test, vi } from "vitest";
import { lookup } from "node:dns/promises";
import { imageResponse, redirectResponse } from "@/test/mocks/fetch";
import { assertPublicUrl, isBlockedAddress, safeFetch } from "../safeFetch";

const PUBLIC_ADDRESS = { address: "93.184.216.34", family: 4 };

function fetchedUrls() {
  return vi
    .mocked(fetch)
    .mock.calls.map(([input]) => (input instanceof Request ? input.url : input.toString()));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(lookup).mockResolvedValue([PUBLIC_ADDRESS] as never);
});

describe("isBlockedAddress", () => {
  test.each([
    "127.0.0.1",
    "127.1.2.3",
    "0.0.0.0",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "192.0.0.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
    "::ffff:a9fe:a9fe",
    "64:ff9b::7f00:1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "fe80::1%eth0",
    "ff02::1",
    "2001:db8::1",
    "2002:7f00:1::1",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  test.each(["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );

  test("blocks values that are not IP addresses", () => {
    expect(isBlockedAddress("")).toBe(true);
    expect(isBlockedAddress("example.com")).toBe(true);
  });
});

describe("assertPublicUrl", () => {
  test.each(["ftp://example.com/file", "file:///etc/passwd", "javascript:alert(1)"])(
    "rejects %s",
    async (url) => {
      await expect(assertPublicUrl(new URL(url))).rejects.toThrow("Disallowed protocol");
      expect(lookup).not.toHaveBeenCalled();
    },
  );

  test.each([
    "http://localhost/",
    "http://LOCALHOST:8080/",
    "http://localhost./",
    "http://api.localhost/",
  ])("rejects %s without a DNS lookup", async (url) => {
    await expect(assertPublicUrl(new URL(url))).rejects.toThrow("Disallowed host");
    expect(lookup).not.toHaveBeenCalled();
  });

  test.each([
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/",
    "http://0x7f.0.0.1/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[fd00::1]/",
  ])("rejects %s without a DNS lookup", async (url) => {
    await expect(assertPublicUrl(new URL(url))).rejects.toThrow("Disallowed address");
    expect(lookup).not.toHaveBeenCalled();
  });

  test("allows a public IP address", async () => {
    await expect(assertPublicUrl(new URL("http://93.184.216.34/"))).resolves.toBeUndefined();
    expect(lookup).not.toHaveBeenCalled();
  });

  test("resolves hostnames and allows public addresses", async () => {
    await expect(assertPublicUrl(new URL("https://example.com/page"))).resolves.toBeUndefined();
    expect(lookup).toHaveBeenCalledExactlyOnceWith("example.com", { all: true });
  });

  test("rejects hostnames that resolve to a private address", async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: "169.254.169.254", family: 4 }] as never);

    await expect(assertPublicUrl(new URL("http://metadata.internal/"))).rejects.toThrow(
      "resolves to a private address",
    );
  });

  test("rejects hostnames when any resolved address is private", async () => {
    vi.mocked(lookup).mockResolvedValue([PUBLIC_ADDRESS, { address: "::1", family: 6 }] as never);

    await expect(assertPublicUrl(new URL("http://rebind.example/"))).rejects.toThrow(
      "resolves to a private address",
    );
  });

  test("rejects hostnames that resolve to nothing", async () => {
    vi.mocked(lookup).mockResolvedValue([] as never);

    await expect(assertPublicUrl(new URL("http://nowhere.example/"))).rejects.toThrow(
      "Disallowed host",
    );
  });

  test("propagates DNS failures", async () => {
    vi.mocked(lookup).mockRejectedValue(new Error("ENOTFOUND"));

    await expect(assertPublicUrl(new URL("http://missing.example/"))).rejects.toThrow("ENOTFOUND");
  });
});

describe("safeFetch", () => {
  test("fetches a public URL with manual redirect handling", async () => {
    const response = imageResponse();
    vi.mocked(fetch).mockResolvedValue(response);
    const signal = AbortSignal.timeout(1000);

    const result = await safeFetch("https://example.com/image.jpg", {
      headers: { Accept: "image/jpeg" },
      signal,
    });

    expect(result).toBe(response);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://example.com/image.jpg", {
      headers: { Accept: "image/jpeg" },
      signal,
      redirect: "manual",
    });
  });

  test("rejects private URLs before fetching", async () => {
    await expect(safeFetch("http://127.0.0.1/admin")).rejects.toThrow("Disallowed address");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("rejects invalid URLs", async () => {
    await expect(safeFetch("not-a-url")).rejects.toThrow("Invalid URL");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("follows redirects, validating each hop", async () => {
    const final = imageResponse();
    vi.mocked(fetch)
      .mockResolvedValueOnce(redirectResponse("https://cdn.example.com/a.jpg", 301))
      .mockResolvedValueOnce(redirectResponse("/b.jpg", 302))
      .mockResolvedValueOnce(final);

    const result = await safeFetch("https://example.com/image.jpg");

    expect(result).toBe(final);
    expect(fetchedUrls()).toEqual([
      "https://example.com/image.jpg",
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
    ]);
    expect(lookup).toHaveBeenCalledTimes(3);
  });

  test("rejects redirects to private destinations", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(redirectResponse("http://169.254.169.254/latest"));

    await expect(safeFetch("https://example.com/image.jpg")).rejects.toThrow("Disallowed address");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("rejects redirects to hosts that resolve to private addresses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(redirectResponse("https://internal.example/"));
    vi.mocked(lookup)
      .mockResolvedValueOnce([PUBLIC_ADDRESS] as never)
      .mockResolvedValueOnce([{ address: "10.0.0.5", family: 4 }] as never);

    await expect(safeFetch("https://example.com/image.jpg")).rejects.toThrow(
      "resolves to a private address",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("rejects redirects to non-http protocols", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(redirectResponse("file:///etc/passwd"));

    await expect(safeFetch("https://example.com/image.jpg")).rejects.toThrow("Disallowed protocol");
  });

  test("gives up after too many redirects", async () => {
    vi.mocked(fetch).mockImplementation(async () => redirectResponse("https://example.com/loop"));

    await expect(safeFetch("https://example.com/image.jpg", { maxRedirects: 2 })).rejects.toThrow(
      "Too many redirects",
    );
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test("returns a redirect response without a Location header as-is", async () => {
    const response = new Response(null, { status: 302 });
    vi.mocked(fetch).mockResolvedValue(response);

    await expect(safeFetch("https://example.com/image.jpg")).resolves.toBe(response);
  });
});
