import "@/styles";
import "../AnchoredPopover";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type AnchoredPopover from "../AnchoredPopover";

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

  describe("anchor positioning", () => {
    test("stays anchored to the trigger while transitioning out", async () => {
      popover.showPopover();
      const anchorName = button.style.anchorName;
      expect(anchorName).not.toBe("");
      expect(popover.style.positionAnchor).toBe(anchorName);

      popover.hidePopover();
      await vi.waitFor(() => expect(popover.matches(":popover-open")).toBe(false));

      expect(getComputedStyle(popover).display).not.toBe("none");
      expect(getComputedStyle(popover).positionAnchor).toBe(anchorName);
      expect(button.style.anchorName).toBe(anchorName);
    });

    test("anchors to whichever trigger opened it", () => {
      const button2 = document.createElement("button");
      button2.setAttribute("popovertarget", popover.id);
      document.body.append(button2);

      button.focus();
      popover.showPopover();
      popover.hidePopover();
      button2.focus();
      popover.showPopover();

      expect(button2.style.anchorName).not.toBe("");
      expect(button2.style.anchorName).not.toBe(button.style.anchorName);
      expect(popover.style.positionAnchor).toBe(button2.style.anchorName);
    });
  });
});
