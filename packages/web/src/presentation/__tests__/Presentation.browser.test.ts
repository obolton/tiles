import "@/styles";
import "@/elements/floating-toolbar/FloatingToolbar";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import Presentation from "../Presentation";

function present() {
  // Measure final positions rather than the toolbar's fade-in
  document.body.dataset.disableTransitions = "";

  const main = document.createElement("main");
  for (const title of ["First slide", "Second slide"]) {
    const slide = document.createElement("page-item");
    slide.textContent = title;
    main.append(slide);
  }
  document.body.append(main);

  Presentation.start(main);
}

function toolbar() {
  const element = document.getElementById("presentation-toolbar");
  if (!element) {
    throw new Error("Missing presentation toolbar");
  }
  return element;
}

afterEach(() => {
  Presentation.stop();
  document.body.replaceChildren();
  delete document.body.dataset.disableTransitions;
});

describe("Presentation", () => {
  test.each([
    { device: "desktop", width: 1280, height: 800, inset: 32 },
    { device: "phone", width: 390, height: 844, inset: 16 },
  ])(
    "centres the toolbar at the bottom of the $device viewport",
    async ({ width, height, inset }) => {
      await page.viewport(width, height);
      present();

      const element = toolbar();
      const rect = element.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;

      expect(rect.height).toBeGreaterThan(0);
      expect(rect.top).toBeGreaterThan(0);
      expect(rect.bottom).toBe(viewportHeight - inset);
      expect(rect.left).toBeGreaterThanOrEqual(inset);
      expect(rect.right).toBeLessThanOrEqual(width - inset);
      expect(rect.left).toBeCloseTo(width - rect.right, 0);

      // The controls sit above the slides, so they can be clicked
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect(hit && element.contains(hit)).toBe(true);
    },
  );

  test("removes the toolbar when the presentation stops", async () => {
    await page.viewport(1280, 800);
    present();
    Presentation.stop();

    expect(document.getElementById("presentation-toolbar")).toBeNull();
    expect(document.body.dataset.presenting).toBeUndefined();
  });
});
