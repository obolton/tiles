import "@/styles";
import "../FloatingToolbar";
import "../ToolbarTab";
import { afterEach, describe, expect, test } from "vitest";
import { render } from "jsx/dom";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";

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
});
