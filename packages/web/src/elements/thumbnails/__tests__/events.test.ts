import { describe, expect, test } from "vitest";
import { ThumbnailListEvent } from "../events";

describe("ThumbnailListEvent", () => {
  test("assigns slideId from options", () => {
    const event = new ThumbnailListEvent("slideselect", { slideId: "slide-1" });

    expect(event.type).toBe("slideselect");
    expect(event.slideId).toBe("slide-1");
    expect(event).toBeInstanceOf(Event);
  });

  test("defaults beforeId to null when omitted", () => {
    const event = new ThumbnailListEvent("slideselect", { slideId: "slide-1" });

    expect(event.beforeId).toBeNull();
  });

  test("assigns beforeId from options", () => {
    const event = new ThumbnailListEvent("slidereorder", {
      slideId: "slide-1",
      beforeId: "slide-3",
    });

    expect(event.type).toBe("slidereorder");
    expect(event.slideId).toBe("slide-1");
    expect(event.beforeId).toBe("slide-3");
  });

  test("preserves null beforeId for trailing reorder", () => {
    const event = new ThumbnailListEvent("slidereorder", {
      slideId: "slide-1",
      beforeId: null,
    });

    expect(event.beforeId).toBeNull();
  });

  test("preserves EventInit options", () => {
    const event = new ThumbnailListEvent("slideselect", {
      slideId: "slide-1",
      bubbles: true,
      cancelable: true,
    });

    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
  });
});
