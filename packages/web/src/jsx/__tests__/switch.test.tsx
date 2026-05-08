import { describe, expect, test } from "vitest";
import { render } from "../dom";
import { renderToString } from "../server";
import { reactive } from "@/utils/reactivity";
import { Switch, Case, Default } from "../switch";

describe("Switch", () => {
  describe("initial render", () => {
    test("renders the matching Case's children", () => {
      const value = reactive("a");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
          <Case value="b">
            <p>B</p>
          </Case>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children.length).toBe(1);
      expect(container.children[0]?.tagName).toBe("SPAN");
      expect(container.children[0]?.textContent).toBe("A");
    });

    test("renders Default when no Case matches", () => {
      const value = reactive("z");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
          <Default>
            <p>fallback</p>
          </Default>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children.length).toBe(1);
      expect(container.children[0]?.tagName).toBe("P");
      expect(container.children[0]?.textContent).toBe("fallback");
    });

    test("renders nothing when no Case matches and no Default", () => {
      const value = reactive("z");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children.length).toBe(0);
    });

    test("works with a single non-array child", () => {
      const value = reactive("a");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");
    });
  });

  describe("reactive updates", () => {
    test("swaps branches when value changes", () => {
      const value = reactive("a");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
          <Case value="b">
            <p>B</p>
          </Case>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");

      value.value = "b";
      expect(container.children.length).toBe(1);
      expect(container.children[0]?.tagName).toBe("P");
      expect(container.children[0]?.textContent).toBe("B");
    });

    test("falls back to Default when value becomes a no-match", () => {
      const value = reactive<string>("a");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
          <Default>
            <p>fallback</p>
          </Default>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");

      value.value = "z";
      expect(container.children.length).toBe(1);
      expect(container.children[0]?.tagName).toBe("P");
      expect(container.children[0]?.textContent).toBe("fallback");
    });

    test("renders the matched branch after starting with no match", () => {
      const value = reactive("z");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children.length).toBe(0);

      value.value = "a";
      expect(container.children.length).toBe(1);
      expect(container.children[0]?.tagName).toBe("SPAN");
    });
  });

  describe("edge cases", () => {
    test("first matching Case wins for duplicate values", () => {
      const value = reactive("a");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Case value="a">
            <span>first</span>
          </Case>
          <Case value="a">
            <p>second</p>
          </Case>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");
      expect(container.children[0]?.textContent).toBe("first");
    });

    test("first Default wins for duplicate Defaults", () => {
      const value = reactive("z");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          <Default>
            <span>first</span>
          </Default>
          <Default>
            <p>second</p>
          </Default>
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");
      expect(container.children[0]?.textContent).toBe("first");
    });

    test("ignores non-element children between branches", () => {
      const value = reactive("a");
      const container = document.createElement("div");
      const nodes = render(
        <Switch value={value}>
          {"  "}
          {null}
          <Case value="a">
            <span>A</span>
          </Case>
          {undefined}
        </Switch>,
      );
      container.append(...nodes);
      expect(container.children.length).toBe(1);
      expect(container.children[0]?.tagName).toBe("SPAN");
    });
  });

  describe("renderToString", () => {
    test("renders the matching Case's children", () => {
      const value = reactive("a");
      const html = renderToString(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
          <Case value="b">
            <p>B</p>
          </Case>
        </Switch>,
      );
      expect(html).toBe("<span>A</span>");
    });

    test("renders Default when no Case matches", () => {
      const value = reactive("z");
      const html = renderToString(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
          <Default>
            <p>fallback</p>
          </Default>
        </Switch>,
      );
      expect(html).toBe("<p>fallback</p>");
    });

    test("renders empty when no Case matches and no Default", () => {
      const value = reactive("z");
      const html = renderToString(
        <Switch value={value}>
          <Case value="a">
            <span>A</span>
          </Case>
        </Switch>,
      );
      expect(html).toBe("");
    });
  });

  describe("misuse", () => {
    test("Case throws when rendered outside Switch", () => {
      expect(() => render(<Case value="a">x</Case>)).toThrowError(
        "<Case> must be a direct child of <Switch>",
      );
    });

    test("Default throws when rendered outside Switch", () => {
      expect(() => render(<Default>x</Default>)).toThrowError(
        "<Default> must be a direct child of <Switch>",
      );
    });
  });
});
