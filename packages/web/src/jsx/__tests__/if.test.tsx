import { describe, expect, test } from "vitest";
import { render } from "../dom";
import { renderToString } from "../server";
import { reactive } from "@/utils/reactivity";
import If from "../if";

describe("If", () => {
  describe("initial render", () => {
    test("renders children when the condition is true", () => {
      const condition = reactive(true);
      const container = document.createElement("div");
      const nodes = render(
        <If condition={condition}>
          <span>visible</span>
        </If>,
      );
      container.append(...nodes);
      expect(container.children).toHaveLength(1);
      expect(container.children[0]?.tagName).toBe("SPAN");
      expect(container.children[0]?.textContent).toBe("visible");
    });

    test("does not render children when the condition is false", () => {
      const condition = reactive(false);
      const container = document.createElement("div");
      const nodes = render(
        <If condition={condition}>
          <span>hidden</span>
        </If>,
      );
      container.append(...nodes);
      expect(container.children).toHaveLength(0);
    });

    test("renders children for truthy non-boolean values", () => {
      const condition = reactive<unknown>("non-empty");
      const container = document.createElement("div");
      const nodes = render(
        <If condition={condition}>
          <span>visible</span>
        </If>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");
    });

    test("does not render children for falsy non-boolean values", () => {
      const condition = reactive<unknown>(0);
      const container = document.createElement("div");
      const nodes = render(
        <If condition={condition}>
          <span>hidden</span>
        </If>,
      );
      container.append(...nodes);
      expect(container.children).toHaveLength(0);
    });
  });

  describe("reactive updates", () => {
    test("removes children when the condition becomes false", () => {
      const condition = reactive(true);
      const container = document.createElement("div");
      const nodes = render(
        <If condition={condition}>
          <span>visible</span>
        </If>,
      );
      container.append(...nodes);
      expect(container.children[0]?.tagName).toBe("SPAN");

      condition.value = false;
      expect(container.children).toHaveLength(0);
    });

    test("renders children when the condition becomes true", () => {
      const condition = reactive(false);
      const container = document.createElement("div");
      const nodes = render(
        <If condition={condition}>
          <span>visible</span>
        </If>,
      );
      container.append(...nodes);
      expect(container.children).toHaveLength(0);

      condition.value = true;
      expect(container.children).toHaveLength(1);
      expect(container.children[0]?.tagName).toBe("SPAN");
      expect(container.children[0]?.textContent).toBe("visible");
    });
  });

  describe("renderToString", () => {
    test("renders children when the condition is true", () => {
      const condition = reactive(true);
      const html = renderToString(
        <If condition={condition}>
          <span>visible</span>
        </If>,
      );
      expect(html).toBe("<span>visible</span>");
    });

    test("renders empty when the condition is false", () => {
      const condition = reactive(false);
      const html = renderToString(
        <If condition={condition}>
          <span>hidden</span>
        </If>,
      );
      expect(html).toBe("");
    });
  });
});
