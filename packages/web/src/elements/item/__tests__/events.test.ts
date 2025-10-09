import { describe, expect, test } from "vitest";
import { PageItemEvent } from "../events";

describe("PageItemEvent", () => {
  test("assigns width and height from options", () => {
    const event = new PageItemEvent("itemresize", {
      width: 320,
      height: 240,
    });

    expect(event.type).toBe("itemresize");
    expect(event.width).toBe(320);
    expect(event.height).toBe(240);
    expect(event).toBeInstanceOf(Event);
  });

  test("defaults width and height to zero when omitted", () => {
    const event = new PageItemEvent("itemresizestart");

    expect(event.width).toBe(0);
    expect(event.height).toBe(0);
  });

  test("preserves EventInit options", () => {
    const event = new PageItemEvent("itemresizeend", {
      width: 10,
      height: 5,
      bubbles: true,
      cancelable: true,
    });

    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
  });
});
