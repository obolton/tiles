import "@/styles";
import "../AnchoredPopover";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type AnchoredPopover from "../AnchoredPopover";

const ANCHOR_NAME = "--popover-anchor";

/** Resolves once the popover's running transitions have finished or been cancelled. */
function transitionsSettled(popover: HTMLElement) {
  return Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
}

describe("AnchoredPopover", () => {
  let popover: AnchoredPopover;
  let button: HTMLButtonElement;

  beforeEach(() => {
    popover = document.createElement("anchored-popover");
    popover.id = "popover";
    popover.textContent = "Content";

    button = document.createElement("button");
    button.setAttribute("popovertarget", popover.id);
    button.textContent = "Open";

    document.body.append(button, popover);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  describe("closing transition", () => {
    test("stays anchored to the trigger until the transition finishes", async () => {
      popover.showPopover();
      popover.hidePopover();
      await vi.waitFor(() => expect(popover.matches(":popover-open")).toBe(false));

      expect(getComputedStyle(popover).display).not.toBe("none");
      expect(popover.style.positionAnchor).toBe(ANCHOR_NAME);
      expect(button.style.anchorName).toBe(ANCHOR_NAME);

      await transitionsSettled(popover);
      await vi.waitFor(() => expect(popover.style.positionAnchor).toBe(""));
      expect(button.style.anchorName).toBe("");
    });

    test("stays anchored when reopened before the transition finishes", async () => {
      popover.showPopover();
      popover.hidePopover();
      popover.showPopover();

      await transitionsSettled(popover);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(popover.matches(":popover-open")).toBe(true);
      expect(popover.style.positionAnchor).toBe(ANCHOR_NAME);
      expect(button.style.anchorName).toBe(ANCHOR_NAME);
    });

    test("moves the anchor to a second trigger opened during the transition", async () => {
      const button2 = document.createElement("button");
      button2.setAttribute("popovertarget", popover.id);
      document.body.append(button2);

      button.focus();
      popover.showPopover();
      popover.hidePopover();
      button2.focus();
      popover.showPopover();

      expect(button.style.anchorName).toBe("");
      expect(button2.style.anchorName).toBe(ANCHOR_NAME);
      expect(popover.anchorElement).toBe(button2);
    });
  });
});
