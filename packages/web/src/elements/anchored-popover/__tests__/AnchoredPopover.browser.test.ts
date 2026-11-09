import "@/styles";
import "@/elements/menu/PopoverMenu";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";

const MENU_MARGIN = 16;
const TOLERANCE = 8;

function renderMenu() {
  const button = document.createElement("button");
  button.id = "trigger";
  button.textContent = "Open";
  button.setAttribute("popovertarget", "menu");
  button.style.cssText = "position: fixed; inset-block-start: 100px; inset-inline-start: 100px;";

  const button2 = document.createElement("button");
  button2.id = "trigger2";
  button2.textContent = "Open";
  button2.setAttribute("popovertarget", "menu");
  button2.style.cssText = "position: fixed; inset-block-start: 100px; inset-inline-start: 400px;";

  const menu = document.createElement("popover-menu");
  menu.id = "menu";
  // Slow the transitions down so the closing state can be observed
  menu.style.setProperty("--animation-duration-short", "1s");
  const item = document.createElement("button");
  item.role = "menuitem";
  item.textContent = "Item";
  menu.append(item);

  document.body.append(button, button2, menu);
  return { button, button2, menu };
}

function expectAnchoredBelow(menu: HTMLElement, anchor: HTMLElement) {
  const menuRect = menu.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  expect(getComputedStyle(menu).display).not.toBe("none");
  expect(Math.abs(menuRect.left - anchorRect.left)).toBeLessThan(TOLERANCE);
  expect(Math.abs(menuRect.top - anchorRect.bottom - MENU_MARGIN)).toBeLessThan(TOLERANCE);
}

function transitionsSettled(element: HTMLElement) {
  return Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
}

beforeEach(async () => {
  await page.viewport(1024, 768);
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("AnchoredPopover", () => {
  test("stays anchored to its trigger while closing from the trigger", async () => {
    const { button, menu } = renderMenu();

    await userEvent.click(button);
    await transitionsSettled(menu);
    expect(menu.matches(":popover-open")).toBe(true);
    expectAnchoredBelow(menu, button);

    await userEvent.click(button);
    expect(menu.matches(":popover-open")).toBe(false);
    expectAnchoredBelow(menu, button);
  });

  test("stays anchored to its trigger while closing from the keyboard", async () => {
    const { button, menu } = renderMenu();

    await userEvent.click(button);
    await transitionsSettled(menu);

    await userEvent.keyboard("{Escape}");
    expect(menu.matches(":popover-open")).toBe(false);
    expectAnchoredBelow(menu, button);
  });

  test("follows whichever trigger opened it", async () => {
    const { button, button2, menu } = renderMenu();

    await userEvent.click(button);
    await transitionsSettled(menu);
    expectAnchoredBelow(menu, button);
    await userEvent.click(button);
    await transitionsSettled(menu);

    await userEvent.click(button2);
    await transitionsSettled(menu);
    expectAnchoredBelow(menu, button2);

    await userEvent.click(button2);
    expect(menu.matches(":popover-open")).toBe(false);
    expectAnchoredBelow(menu, button2);
  });
});
