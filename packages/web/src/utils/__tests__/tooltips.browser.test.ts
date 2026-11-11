import "@/styles";
import "@/utils/tooltips";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";

const TOOLTIP_DELAY = 500;

function renderButtons() {
  const plain = document.createElement("button");
  plain.textContent = "Plain";
  const labelled = document.createElement("button");
  labelled.dataset.tooltip = "Labelled";
  labelled.textContent = "Labelled";
  document.body.append(plain, labelled);
  return { plain, labelled };
}

function isTooltipOpen() {
  return document.getElementById("tooltip")?.matches(":popover-open") ?? false;
}

function getTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) {
    throw new Error("Tooltip not found");
  }
  return tooltip;
}

function getTooltipBounds() {
  return getTooltip().getBoundingClientRect();
}

async function hoverUntilOpen(element: HTMLElement) {
  await userEvent.hover(element);
  await expect.poll(isTooltipOpen, { timeout: TOOLTIP_DELAY * 4 }).toBe(true);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(async () => {
  await userEvent.keyboard("{Escape}");
  // The tooltip is shared, so clear positioning left by the previous test
  const tooltip = document.getElementById("tooltip");
  tooltip?.removeAttribute("style");
  tooltip?.removeAttribute("data-position");
  document.body.replaceChildren();
});

describe("tooltips", () => {
  test("does not show a tooltip when focus moves by script after a click", async () => {
    const { plain, labelled } = renderButtons();
    await userEvent.click(plain);

    labelled.focus();
    await wait(TOOLTIP_DELAY * 2);

    expect(document.activeElement).toBe(labelled);
    expect(isTooltipOpen()).toBe(false);
  });

  test("shows a tooltip when focus moves by keyboard", async () => {
    const { plain } = renderButtons();
    plain.focus();

    await userEvent.tab();

    await expect.poll(isTooltipOpen, { timeout: TOOLTIP_DELAY * 4 }).toBe(true);
    expect(document.getElementById("tooltip")?.textContent).toBe("Labelled");
  });

  describe.each([
    { name: "with anchor positioning", anchored: true },
    { name: "without anchor positioning", anchored: false },
  ])("$name", ({ anchored }) => {
    beforeEach(() => {
      if (!anchored) {
        vi.spyOn(CSS, "supports").mockReturnValue(false);
      }
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test(`${anchored ? "anchors" : "does not anchor"} a tooltip to its target with CSS`, async () => {
      const { labelled } = renderButtons();

      await hoverUntilOpen(labelled);

      expect(getTooltip().hasAttribute("data-position")).toBe(anchored);
    });

    test("flips a tooltip above a target at the bottom of the viewport", async () => {
      const { labelled } = renderButtons();
      labelled.style.cssText = "position: fixed; inset: auto 0 0; height: 40px";

      await hoverUntilOpen(labelled);

      const tooltip = getTooltipBounds();
      const target = labelled.getBoundingClientRect();
      expect(tooltip.bottom).toBeLessThanOrEqual(target.top);
    });

    test("shifts a tooltip horizontally to stay within the viewport", async () => {
      const { labelled } = renderButtons();
      labelled.dataset.tooltip = "A tooltip much wider than its target";
      labelled.style.cssText = "position: fixed; top: 0; right: 0; width: 24px";

      await hoverUntilOpen(labelled);

      const tooltip = getTooltipBounds();
      const target = labelled.getBoundingClientRect();
      expect(tooltip.top).toBeGreaterThanOrEqual(target.bottom);
      expect(tooltip.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
      expect(tooltip.left).toBeGreaterThanOrEqual(0);
    });

    test("flips a tooltip to the other side of a target at the edge of the viewport", async () => {
      const { labelled } = renderButtons();
      labelled.dataset.tooltipPosition = "left";
      labelled.style.cssText = "position: fixed; top: 100px; left: 0";

      await hoverUntilOpen(labelled);

      const tooltip = getTooltipBounds();
      const target = labelled.getBoundingClientRect();
      expect(tooltip.left).toBeGreaterThanOrEqual(target.right);
      expect(tooltip.top).toBeLessThan(target.bottom);
      expect(tooltip.bottom).toBeGreaterThan(target.top);
    });

    test("wraps a tooltip that is wider than the viewport", async () => {
      const { labelled } = renderButtons();
      labelled.dataset.tooltip = "A very long tooltip ".repeat(20);

      await hoverUntilOpen(labelled);

      const tooltip = getTooltipBounds();
      expect(tooltip.left).toBeGreaterThanOrEqual(0);
      expect(tooltip.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    });
  });
});
