import "@/styles";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";

const TOOLTIP_DELAY = 500;

function renderTarget(style: string, position?: string) {
  const button = document.createElement("button");
  button.dataset.tooltip = "A tooltip much wider than its target";
  if (position) {
    button.dataset.tooltipPosition = position;
  }
  button.textContent = "×";
  button.style.cssText = `position: fixed; ${style}`;
  document.body.append(button);
  return button;
}

function getTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) {
    throw new Error("Tooltip not found");
  }
  return tooltip;
}

async function hoverUntilOpen(element: HTMLElement) {
  await userEvent.hover(element);
  await expect
    .poll(() => document.getElementById("tooltip")?.matches(":popover-open"), {
      timeout: TOOLTIP_DELAY * 4,
    })
    .toBe(true);
  return getTooltip().getBoundingClientRect();
}

beforeAll(async () => {
  vi.spyOn(CSS, "supports").mockReturnValue(false);
  await import("@/utils/tooltips");
});

afterEach(async () => {
  await userEvent.keyboard("{Escape}");
  document.body.replaceChildren();
});

describe("tooltips without anchor positioning", () => {
  test("positions a tooltip with script", async () => {
    const target = renderTarget("top: 100px; left: 200px");

    await hoverUntilOpen(target);

    expect(getTooltip().dataset.position).toBeUndefined();
    expect(getTooltip().style.top).not.toBe("");
  });

  test("shifts a tooltip horizontally to stay within the viewport", async () => {
    const target = renderTarget("top: 0; right: 0");

    const tooltip = await hoverUntilOpen(target);

    expect(tooltip.top).toBeGreaterThanOrEqual(target.getBoundingClientRect().bottom);
    expect(tooltip.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  });

  test("flips a tooltip above a target at the bottom of the viewport", async () => {
    const target = renderTarget("bottom: 0; left: 0");

    const tooltip = await hoverUntilOpen(target);

    expect(tooltip.bottom).toBeLessThanOrEqual(target.getBoundingClientRect().top);
    expect(tooltip.left).toBeGreaterThanOrEqual(0);
  });

  test("flips a tooltip to the other side of a target at the edge of the viewport", async () => {
    const target = renderTarget("top: 100px; left: 0", "left");

    const tooltip = await hoverUntilOpen(target);

    expect(tooltip.left).toBeGreaterThanOrEqual(target.getBoundingClientRect().right);
  });
});
