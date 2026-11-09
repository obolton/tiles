import "@/styles";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import { reactive } from "reactivity";
import EditorLayout from "../EditorLayout";
import { PanelResizeEvent } from "@/elements/resizable-panel/events";
import barStyles from "../EditablePage.module.css";
import type { JSX } from "jsx/jsx";

function renderLayout() {
  // Measure final positions rather than the panels' slide-in transitions
  document.body.dataset.disableTransitions = "";
  const end = reactive<JSX.Node>(<div id="end-panel">End</div>);
  const nodes = render(
    <EditorLayout
      start={<div id="start-panel">Start</div>}
      end={end}
      bar={<div id="bar" className={barStyles["bottom-bar"]} />}
    >
      <main id="content">Content</main>
    </EditorLayout>,
  );
  document.body.append(...nodes);
  return { end };
}

function rectOf(selector: string) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element.getBoundingClientRect();
}

function wrapperOf(selector: string) {
  const panel = document.querySelector(selector);
  if (!panel?.parentElement) {
    throw new Error(`Missing element: ${selector}`);
  }
  return panel.parentElement;
}

function resize(selector: string, size: number) {
  document
    .querySelector(selector)
    ?.dispatchEvent(new PanelResizeEvent("panelresize", { size, bubbles: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("EditorLayout", () => {
  test("places the panels beside the content at desktop width", async () => {
    await page.viewport(1280, 800);
    renderLayout();
    resize("#start-panel", 480);

    const layout = wrapperOf("#content");
    expect(getComputedStyle(layout).paddingLeft).toBe("480px");
    expect(getComputedStyle(layout).paddingRight).toBe("280px");
    expect(rectOf("#start-panel").width).toBe(480);
    expect(rectOf("#end-panel").width).toBe(280);
  });

  test("insets the bar by the panel widths at desktop width", async () => {
    await page.viewport(1280, 800);
    renderLayout();
    resize("#start-panel", 480);

    const bar = rectOf("#bar");
    expect(bar.left).toBe(480 + 32);
    expect(bar.right).toBe(1280 - 280 - 32);
  });

  test("collapses the end slot while it has no panel", async () => {
    await page.viewport(1280, 800);
    const { end } = renderLayout();

    end.value = null;

    const layout = wrapperOf("#content");
    expect(document.querySelector("#end-panel")).toBeNull();
    expect(getComputedStyle(layout).paddingRight).toBe("0px");

    end.value = <div id="end-panel">End</div>;
    expect(rectOf("#end-panel").width).toBe(280);
    expect(getComputedStyle(layout).paddingRight).toBe("280px");
  });

  test("clamps wide panels at tablet width", async () => {
    await page.viewport(768, 1024);
    renderLayout();
    resize("#start-panel", 480);

    const layout = wrapperOf("#content");
    const start = wrapperOf("#start-panel").getBoundingClientRect();
    expect(start.width).toBeCloseTo(768 * 0.3, 0);
    expect(parseFloat(getComputedStyle(layout).paddingLeft)).toBeCloseTo(768 * 0.3, 0);
    expect(rectOf("#end-panel").width).toBeCloseTo(768 * 0.3, 0);
  });

  test("shows the start panel as a rail and the end panel as a sheet at phone width", async () => {
    const WIDTH = 390;
    await page.viewport(WIDTH, 844);
    renderLayout();
    resize("#start-panel", 480);
    const HEIGHT = document.documentElement.clientHeight;

    const layout = wrapperOf("#content");
    expect(getComputedStyle(layout).paddingLeft).toBe("0px");
    expect(getComputedStyle(layout).paddingRight).toBe("0px");
    expect(getComputedStyle(layout).paddingTop).toBe("96px");
    expect(rectOf("#bar").left).toBe(16);
    expect(rectOf("#bar").right).toBe(WIDTH - 16);

    const start = wrapperOf("#start-panel").getBoundingClientRect();
    expect(start.left).toBe(0);
    expect(start.width).toBe(WIDTH);
    expect(start.height).toBe(96);

    const end = wrapperOf("#end-panel").getBoundingClientRect();
    expect(end.left).toBe(0);
    expect(end.width).toBe(WIDTH);
    expect(end.bottom).toBe(HEIGHT);
    expect(end.top).toBeGreaterThan(HEIGHT / 2);
  });
});
