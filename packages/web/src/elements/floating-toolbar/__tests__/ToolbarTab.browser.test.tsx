import "@/styles";
import "../FloatingToolbar";
import "../ToolbarTab";
import { afterEach, describe, expect, test } from "vitest";
import { render } from "jsx/dom";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";

const SUPPORTS_VIEW_TIMELINE = CSS.supports("animation-timeline", "view()");

function renderToolbar(className?: string) {
  const nodes = render(
    <div style={{ width: "320px" }}>
      <floating-toolbar className={className} aria-label="Toolbar">
        <toolbar-tab name="tab" label="Tab">
          {Array.from({ length: 4 }, (_, group) => (
            <ToolbarGroup label={`Group ${group}`}>
              {Array.from({ length: 4 }, (_, button) => (
                <ToolbarButton label={`Button ${group}-${button}`}>
                  <span>{button}</span>
                </ToolbarButton>
              ))}
            </ToolbarGroup>
          ))}
        </toolbar-tab>
      </floating-toolbar>
    </div>,
  );
  document.body.append(...nodes);
}

function tab() {
  const element = document.querySelector("toolbar-tab");
  if (!element) {
    throw new Error("Missing tab");
  }
  return element;
}

function buttons() {
  return Array.from(document.querySelectorAll("toolbar-tab button"));
}

/** The opacity applied by an item's edge fade, 1 when none is in effect. */
function fadeOf(element: Element) {
  const match = /opacity\((\d*\.?\d+)\)/.exec(getComputedStyle(element).filter);
  return match ? Number(match[1]) : 1;
}

async function nextFrame() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ToolbarTab", () => {
  test("keeps a non-primary toolbar at its content width", () => {
    renderToolbar();
    expect(getComputedStyle(tab()).overflowX).toBe("visible");
    expect(tab().getBoundingClientRect().width).toBeGreaterThan(320);
  });

  test("scrolls a primary toolbar that is wider than its container", () => {
    renderToolbar("primary");
    expect(getComputedStyle(tab()).overflowX).toBe("auto");
    expect(tab().scrollWidth).toBeGreaterThan(tab().clientWidth);
    expect(tab().getBoundingClientRect().width).toBe(320);
  });

  test.runIf(SUPPORTS_VIEW_TIMELINE)(
    "fades the items at the edge with more to scroll to",
    async () => {
      renderToolbar("primary");
      const items = buttons();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        throw new Error("Missing buttons");
      }
      await nextFrame();
      expect(fadeOf(first)).toBe(1);
      expect(fadeOf(last)).toBe(0);
      const { right } = tab().getBoundingClientRect();
      const clipped = items.find((item) => item.getBoundingClientRect().right > right);
      expect(clipped).toBeDefined();
      expect(fadeOf(clipped as Element)).toBeLessThan(1);

      tab().scrollLeft = tab().scrollWidth;
      await nextFrame();
      expect(fadeOf(first)).toBe(0);
      expect(fadeOf(last)).toBe(1);
    },
  );

  test.runIf(SUPPORTS_VIEW_TIMELINE)(
    "does not fade items when there is nothing to scroll",
    async () => {
      renderToolbar();
      await nextFrame();
      expect(buttons().every((item) => fadeOf(item) === 1)).toBe(true);
    },
  );
});
