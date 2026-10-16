import { afterEach, describe, expect, test } from "vitest";
import { render } from "@/jsx/dom";
import "../TabBar";
import TabItem from "../TabItem";
import TabPanel from "../TabPanel";

function renderTabs(container: HTMLElement) {
  container.append(
    ...render(
      <>
        <tab-bar>
          <tab-item id="first-tab" for="first-panel" selected>
            First
          </tab-item>
          <tab-item id="second-tab" for="second-panel">
            Second
          </tab-item>
        </tab-bar>
        <tab-panel id="first-panel" open>
          First panel
        </tab-panel>
        <tab-panel id="second-panel">Second panel</tab-panel>
      </>,
    ),
  );
}

function query<T extends Element>(root: ParentNode, selector: string, type: new () => T): T {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) {
    throw new Error(`Missing ${selector}`);
  }
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("TabItem", () => {
  describe("panel", () => {
    test("resolves the panel referenced by the for attribute", () => {
      renderTabs(document.body);
      const tab = query(document, "#second-tab", TabItem);
      expect(tab.panel).toBe(query(document, "#second-panel", TabPanel));
    });
  });

  describe("select", () => {
    test("opens its panel and closes the others", () => {
      renderTabs(document.body);
      query(document, "#second-tab", TabItem).click();

      expect(query(document, "#first-panel", TabPanel).hasAttribute("open")).toBe(false);
      expect(query(document, "#second-panel", TabPanel).hasAttribute("open")).toBe(true);
    });
  });
});
