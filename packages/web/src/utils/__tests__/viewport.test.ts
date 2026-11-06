import { afterEach, describe, expect, test, vi } from "vitest";
import { mediaQuery } from "../viewport";

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  const list = {
    matches,
    addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => {
      listeners.add(listener);
    },
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(list));
  return {
    change(value: boolean) {
      list.matches = value;
      for (const listener of listeners) {
        listener({ matches: value });
      }
    },
  };
}

describe("mediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reflects the initial match state", () => {
    stubMatchMedia(true);
    expect(mediaQuery("(width < 640px)").value).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith("(width < 640px)");
  });

  test("updates when the query changes", () => {
    const media = stubMatchMedia(false);
    const matches = mediaQuery("(width < 640px)");
    expect(matches.value).toBe(false);
    media.change(true);
    expect(matches.value).toBe(true);
  });

  test("never matches without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(mediaQuery("(width < 640px)").value).toBe(false);
  });
});
