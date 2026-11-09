import "@/styles";
import "../FloatingToolbar";
import "../ToolbarTab";
import { afterEach, describe, expect, test } from "vitest";
import { render } from "jsx/dom";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";

const SUPPORTS_SCROLL_TIMELINE = CSS.supports("animation-timeline", "scroll()");

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

function scroller() {
  const element = document.querySelector("toolbar-tab")?.shadowRoot?.getElementById("scroller");
  if (!element) {
    throw new Error("Missing scroller");
  }
  return element;
}

function fades() {
  const style = getComputedStyle(scroller());
  return {
    start: style.getPropertyValue("--toolbar-fade-start"),
    end: style.getPropertyValue("--toolbar-fade-end"),
  };
}

async function nextFrame() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ToolbarTab", () => {
  test("slots its groups into a scroller", () => {
    renderToolbar();
    const slot = scroller().querySelector("slot");
    expect(slot?.assignedElements()).toHaveLength(4);
  });

  test("keeps a non-primary toolbar at its content width", () => {
    renderToolbar();
    expect(getComputedStyle(scroller()).overflowX).toBe("visible");
    expect(document.querySelector("toolbar-tab")?.getBoundingClientRect().width).toBeGreaterThan(
      320,
    );
  });

  test("scrolls a primary toolbar that is wider than its container", () => {
    renderToolbar("primary");
    const element = scroller();
    expect(getComputedStyle(element).overflowX).toBe("auto");
    expect(element.scrollWidth).toBeGreaterThan(element.clientWidth);
    expect(document.querySelector("toolbar-tab")?.getBoundingClientRect().width).toBe(320);
  });

  test.runIf(SUPPORTS_SCROLL_TIMELINE)("fades only the edge with more to scroll to", async () => {
    renderToolbar("primary");
    const element = scroller();
    await nextFrame();
    expect(fades()).toEqual({ start: "0px", end: "32px" });

    element.scrollLeft = element.scrollWidth;
    await nextFrame();
    expect(fades()).toEqual({ start: "32px", end: "0px" });
  });

  test.runIf(SUPPORTS_SCROLL_TIMELINE)(
    "shows no fades when there is nothing to scroll",
    async () => {
      renderToolbar();
      await nextFrame();
      expect(fades()).toEqual({ start: "0px", end: "0px" });
    },
  );
});
