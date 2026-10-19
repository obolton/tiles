import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "../dom";
import { renderToString } from "../server";
import { reactive } from "reactivity";
import Each from "../each";

describe("Each", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("initial render", () => {
    test("renders an element for each item in order", () => {
      const items = reactive(["a", "b", "c"]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);
      expect(container.children).toHaveLength(3);
      expect(container.children[0]?.textContent).toBe("a");
      expect(container.children[1]?.textContent).toBe("b");
      expect(container.children[2]?.textContent).toBe("c");
    });

    test("passes the item and index to the renderer", () => {
      const items = reactive(["a", "b", "c"]);
      const renderer = vi.fn((item: string, index: number) => (
        <span>
          {index}:{item}
        </span>
      ));
      render(<Each items={items}>{renderer}</Each>);
      expect(renderer).toHaveBeenCalledTimes(3);
      expect(renderer).toHaveBeenNthCalledWith(1, "a", 0);
      expect(renderer).toHaveBeenNthCalledWith(2, "b", 1);
      expect(renderer).toHaveBeenNthCalledWith(3, "c", 2);
    });

    test("renders nothing when items is empty", () => {
      const items = reactive<string[]>([]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);
      expect(container.children).toHaveLength(0);
    });
  });

  describe("reactive updates", () => {
    test("appends new items", () => {
      const items = reactive(["a", "b"]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);

      items.value = ["a", "b", "c"];
      expect(container.children).toHaveLength(3);
      expect(container.children[2]?.textContent).toBe("c");
    });

    test("prepends new items", () => {
      const items = reactive(["b", "c"]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);

      items.value = ["a", "b", "c"];
      expect(container.children).toHaveLength(3);
      expect(container.children[0]?.textContent).toBe("a");
      expect(container.children[1]?.textContent).toBe("b");
      expect(container.children[2]?.textContent).toBe("c");
    });

    test("removes items that are no longer in the list", () => {
      const items = reactive(["a", "b", "c"]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);

      items.value = ["a", "c"];
      expect(container.children).toHaveLength(2);
      expect(container.children[0]?.textContent).toBe("a");
      expect(container.children[1]?.textContent).toBe("c");
    });

    test("preserves DOM nodes for items that move", () => {
      const items = reactive(["a", "b", "c"]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);
      const originalA = container.children[0];
      const originalB = container.children[1];
      const originalC = container.children[2];

      items.value = ["c", "a", "b"];
      expect(container.children[0]).toBe(originalC);
      expect(container.children[1]).toBe(originalA);
      expect(container.children[2]).toBe(originalB);
    });

    test("does not re-invoke the renderer for items that already rendered", () => {
      const items = reactive(["a", "b"]);
      const renderer = vi.fn((item: string) => <span>{item}</span>);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{renderer}</Each>);
      container.append(...nodes);
      expect(renderer).toHaveBeenCalledTimes(2);

      items.value = ["b", "a"];
      expect(renderer).toHaveBeenCalledTimes(2);

      items.value = ["a", "b", "c"];
      expect(renderer).toHaveBeenCalledTimes(3);
      expect(renderer).toHaveBeenLastCalledWith("c", 2);
    });

    test("renders new items after starting empty", () => {
      const items = reactive<string[]>([]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);
      expect(container.children).toHaveLength(0);

      items.value = ["a", "b"];
      expect(container.children).toHaveLength(2);
      expect(container.children[0]?.textContent).toBe("a");
      expect(container.children[1]?.textContent).toBe("b");
    });

    test("removes all items when emptied", () => {
      const items = reactive(["a", "b"]);
      const container = document.createElement("div");
      const nodes = render(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      container.append(...nodes);

      items.value = [];
      expect(container.children).toHaveLength(0);
    });
  });

  describe("renderToString", () => {
    test("renders an element for each item", () => {
      vi.stubEnv("SSR", true);
      const items = reactive(["a", "b", "c"]);
      const html = renderToString(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      expect(html).toBe("<span>a</span><span>b</span><span>c</span>");
    });

    test("renders nothing for an empty list", () => {
      vi.stubEnv("SSR", true);
      const items = reactive<string[]>([]);
      const html = renderToString(<Each items={items}>{(item) => <span>{item}</span>}</Each>);
      expect(html).toBe("");
    });
  });
});
