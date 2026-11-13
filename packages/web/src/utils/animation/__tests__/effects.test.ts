import { afterEach, describe, expect, test, vi } from "vitest";
import { animate } from "../effects";
import { REDUCED_MOTION_QUERY, stubMatchMedia, unstubMatchMedia } from "@/test/mocks/matchMedia";

function mockAnimate(element: Element) {
  const animation = {
    finish: vi.fn(),
    finished: Promise.resolve(),
  };
  const spy = vi.fn().mockReturnValue(animation);
  Object.defineProperty(element, "animate", { value: spy });
  return { animation, spy };
}

describe("animate", () => {
  afterEach(() => {
    unstubMatchMedia();
  });

  test("runs the animation", () => {
    stubMatchMedia();
    const element = document.createElement("div");
    const { animation, spy } = mockAnimate(element);
    const keyframes = [{ opacity: 0 }, { opacity: 1 }];
    const timing = { duration: 100 };

    expect(animate(element, keyframes, timing)).toBe(animation);
    expect(spy).toHaveBeenCalledWith(keyframes, timing);
    expect(animation.finish).not.toHaveBeenCalled();
  });

  test("finishes the animation immediately when the user prefers reduced motion", () => {
    stubMatchMedia(REDUCED_MOTION_QUERY);
    const element = document.createElement("div");
    const { animation } = mockAnimate(element);

    animate(element, [{ opacity: 0 }], { duration: 100 });
    expect(animation.finish).toHaveBeenCalled();
  });
});
