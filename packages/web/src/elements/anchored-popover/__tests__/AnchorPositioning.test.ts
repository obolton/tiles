import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

vi.hoisted(() => {
  vi.stubGlobal("CSS", {
    registerProperty: vi.fn(),
    supports: vi.fn(() => true),
  });
});

import AnchoredPopover from "../AnchoredPopover";

describe("AnchoredPopover", () => {
  describe("anchor positioning", () => {
    let popover: AnchoredPopover;
    let button: HTMLElement;

    beforeEach(() => {
      popover = document.createElement("anchored-popover");
      popover.id = "popover";
      document.body.appendChild(popover);

      button = document.createElement("button");
      button.id = "button";
      button.setAttribute("popovertarget", popover.id);
      document.body.appendChild(button);
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    test("names the trigger and anchors the popover to it", () => {
      button.focus();
      popover.showPopover();

      expect(button.style.anchorName).toBe("--popover-anchor");
      expect(popover.style.positionAnchor).toBe("--popover-anchor");
    });

    test("uses the toggle event source as the trigger", () => {
      const source = document.createElement("button");
      document.body.appendChild(source);
      button.focus();

      popover.showPopover({ source });

      expect(popover.anchorElement).toBe(source);
      expect(source.getAttribute("aria-expanded")).toBe("true");
      expect(button.getAttribute("aria-expanded")).toBeNull();
      expect(source.style.anchorName).toBe("--popover-anchor");
      expect(button.style.anchorName).toBe("");
    });

    test("stays anchored to the trigger after closing", () => {
      button.focus();
      popover.showPopover();

      popover.hidePopover();

      expect(popover.style.positionAnchor).toBe("--popover-anchor");
      expect(button.style.anchorName).toBe("--popover-anchor");
    });

    test("moves the anchor name to a different trigger when reopened", () => {
      const button2 = document.createElement("button");
      button2.setAttribute("popovertarget", popover.id);
      document.body.appendChild(button2);

      button.focus();
      popover.showPopover();
      popover.hidePopover();

      button2.focus();
      popover.showPopover();

      expect(button2.style.anchorName).toBe("--popover-anchor");
      expect(button.style.anchorName).toBe("");
      expect(popover.style.positionAnchor).toBe("--popover-anchor");
    });

    test("leaves another popover's anchor name on a shared trigger", () => {
      const popover2 = document.createElement("anchored-popover");
      popover2.id = "popover2";
      const other = document.createElement("button");
      document.body.append(popover2, other);

      popover.showPopover({ source: button });
      popover.hidePopover();
      popover2.showPopover({ source: button });
      popover.showPopover({ source: other });

      expect(button.style.anchorName).toBe("--popover2-anchor");
      expect(other.style.anchorName).toBe("--popover-anchor");
    });

    test("falls back to the implicit anchor without a trigger", () => {
      button.focus();
      popover.showPopover();
      popover.hidePopover();
      button.remove();

      popover.showPopover();

      expect(popover.anchorElement).toBeNull();
      expect(popover.style.positionAnchor).toBe("");
    });

    test("anchors to the element named by the anchor attribute", () => {
      button.remove();
      const anchor = document.createElement("div");
      anchor.id = "anchor";
      document.body.appendChild(anchor);
      popover.setAttribute("anchor", "anchor");

      popover.showPopover();

      expect(anchor.style.anchorName).toBe("--popover-anchor");
      expect(popover.style.positionAnchor).toBe("--popover-anchor");
    });

    test("re-anchors when the anchor attribute changes while open", () => {
      button.remove();
      const first = document.createElement("div");
      first.id = "first";
      const second = document.createElement("div");
      second.id = "second";
      document.body.append(first, second);
      popover.setAttribute("anchor", "first");
      popover.showPopover();
      vi.spyOn(popover, "matches").mockReturnValue(true);

      popover.setAttribute("anchor", "second");

      expect(second.style.anchorName).toBe("--popover-anchor");
      expect(first.style.anchorName).toBe("");
    });
  });
});
