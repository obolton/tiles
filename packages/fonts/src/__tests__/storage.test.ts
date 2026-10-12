import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("wrangler", () => ({
  getPlatformProxy: vi.fn(),
}));

import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { openFontBucket, type FontBucket } from "../storage";

const FONTS: FontBucket = { head: vi.fn(), put: vi.fn() };
const dispose = vi.fn();
const proxy = { env: { FONTS }, dispose } as unknown as PlatformProxy;

describe("openFontBucket", () => {
  beforeEach(() => {
    vi.mocked(getPlatformProxy).mockReset();
    vi.mocked(getPlatformProxy).mockResolvedValue(proxy);
    dispose.mockReset();
  });

  test("reads the package's Wrangler config and persists to the shared local state", async () => {
    await openFontBucket();

    expect(getPlatformProxy).toHaveBeenCalledWith({
      configPath: expect.stringMatching(/\/packages\/fonts\/wrangler\.jsonc$/),
      persist: { path: expect.stringMatching(/\/\.wrangler\/state\/v3$/) },
      environment: undefined,
    });
  });

  test("forwards the requested Wrangler environment", async () => {
    await openFontBucket("remote");

    expect(getPlatformProxy).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "remote" }),
    );
  });

  test("exposes the FONTS binding", async () => {
    const session = await openFontBucket();

    expect(session.bucket).toBe(FONTS);
  });

  test("disposes the proxy", async () => {
    const session = await openFontBucket();
    await session.dispose();

    expect(dispose).toHaveBeenCalledOnce();
  });
});
