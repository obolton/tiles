import { describe, expect, test } from "vitest";
import { ReorderEvent, DeleteEvent } from "../events";

describe("ReorderEvent", () => {
  test("creates an event with the correct type", () => {
    const event = new ReorderEvent({ fromIndex: 0, toIndex: 1 });
    expect(event.type).toBe("reorder");
  });

  test("stores fromIndex and toIndex", () => {
    const event = new ReorderEvent({ fromIndex: 2, toIndex: 5 });
    expect(event.fromIndex).toBe(2);
    expect(event.toIndex).toBe(5);
  });

  test("bubbles by default", () => {
    const event = new ReorderEvent({ fromIndex: 0, toIndex: 1 });
    expect(event.bubbles).toBe(true);
  });

  test("respects bubbles option when set to false", () => {
    const event = new ReorderEvent({
      fromIndex: 0,
      toIndex: 1,
      bubbles: false,
    });
    expect(event.bubbles).toBe(false);
  });

  test("is not cancelable by default", () => {
    const event = new ReorderEvent({ fromIndex: 0, toIndex: 1 });
    expect(event.cancelable).toBe(false);
  });

  test("respects the cancelable option", () => {
    const event = new ReorderEvent({
      fromIndex: 0,
      toIndex: 1,
      cancelable: true,
    });
    expect(event.cancelable).toBe(true);
  });
});

describe("DeleteEvent", () => {
  test("creates an event with the correct type", () => {
    const event = new DeleteEvent();
    expect(event.type).toBe("delete");
  });

  test("bubbles by default", () => {
    const event = new DeleteEvent();
    expect(event.bubbles).toBe(true);
  });

  test("respects bubbles option when set to false", () => {
    const event = new DeleteEvent({ bubbles: false });
    expect(event.bubbles).toBe(false);
  });

  test("is not cancelable by default", () => {
    const event = new DeleteEvent();
    expect(event.cancelable).toBe(false);
  });

  test("respects the cancelable option", () => {
    const event = new DeleteEvent({ cancelable: true });
    expect(event.cancelable).toBe(true);
  });
});
