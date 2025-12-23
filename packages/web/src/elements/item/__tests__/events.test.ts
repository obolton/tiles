import { describe, expect, test } from "vitest";
import { PageItemEvent } from "../events";

describe("PageItemEvent", () => {
  test("assigns rect from options", () => {
    const rect = new DOMRect(100, 200, 320, 240);
    const event = new PageItemEvent("itemresize", {
      rect,
      clientX: 420,
      clientY: 440,
    });

    expect(event.type).toBe("itemresize");
    expect(event.rect).toBe(rect);
    expect(event.rect.x).toBe(100);
    expect(event.rect.y).toBe(200);
    expect(event.rect.width).toBe(320);
    expect(event.rect.height).toBe(240);
    expect(event.clientX).toBe(420);
    expect(event.clientY).toBe(440);
    expect(event).toBeInstanceOf(Event);
  });

  test("rect properties are mutable", () => {
    const rect = new DOMRect(0, 0, 100, 100);
    const event = new PageItemEvent("itemresize", {
      rect,
      clientX: 100,
      clientY: 100,
    });

    event.rect.x = 50;
    event.rect.width = 200;

    expect(event.rect.x).toBe(50);
    expect(event.rect.width).toBe(200);
  });

  test("preserves EventInit options", () => {
    const event = new PageItemEvent("itemresizeend", {
      rect: new DOMRect(0, 0, 10, 5),
      clientX: 10,
      clientY: 5,
      bubbles: true,
      cancelable: true,
    });

    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
  });
});
