import { afterEach, describe, expect, test } from "vitest";
import { prefersReducedMotion } from "../preferences";
import { REDUCED_MOTION_QUERY, stubMatchMedia, unstubMatchMedia } from "@/test/mocks/matchMedia";

describe("prefersReducedMotion", () => {
  afterEach(() => {
    unstubMatchMedia();
  });

  test("returns true when the user prefers reduced motion", () => {
    stubMatchMedia(REDUCED_MOTION_QUERY);
    expect(prefersReducedMotion()).toBe(true);
  });

  test("returns false when the user has no motion preference", () => {
    stubMatchMedia();
    expect(prefersReducedMotion()).toBe(false);
  });

  test("returns false without matchMedia", () => {
    unstubMatchMedia();
    expect(prefersReducedMotion()).toBe(false);
  });
});
