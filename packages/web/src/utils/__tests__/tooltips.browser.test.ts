import "@/styles";
import "@/utils/tooltips";
import { afterEach, describe, expect, test } from "vitest";
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(async () => {
  await userEvent.keyboard("{Escape}");
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
});
