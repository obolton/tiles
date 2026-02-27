import { describe, expect, test, vi } from "vitest";
import { jsx } from "../jsx";
import { render, hydrate } from "../dom";
import { BOOLEAN_STRING_ATTRIBUTES } from "../attributes";
import { reactive } from "@/utils/reactivity";

describe("render", () => {
  test("creates an element with the given type", () => {
    const nodes = render(jsx("div", {}));
    expect(nodes.length).toBe(1);
    expect(nodes[0]).toBeInstanceOf(HTMLElement);
    expect((nodes[0] as HTMLElement).tagName).toBe("DIV");
  });

  test("sets the attributes of the element", () => {
    const [element] = render(
      jsx("div", { id: "test-id", className: "test-class" }),
    ) as [HTMLElement];
    expect(element.id).toBe("test-id");
    expect(element.className).toBe("test-class");
  });

  test("sets the properties of the element", () => {
    const [element] = render(
      jsx("div", { $id: "test-id", $className: "test-class" }),
    ) as [HTMLElement];
    expect(element.id).toBe("test-id");
    expect(element.className).toBe("test-class");
  });

  describe("styles", () => {
    test("sets styles from an object", () => {
      const style = { backgroundColor: "red", padding: "0" };
      const [element] = render(jsx("div", { style })) as [HTMLElement];
      expect(element.style.backgroundColor).toBe("red");
      expect(element.style.padding).toBe("0px");
    });

    test("sets and updates styles from a reactive object", () => {
      const style = reactive({ backgroundColor: "red", padding: "0" });
      const [element] = render(jsx("div", { style })) as [HTMLElement];
      expect(element.style.backgroundColor).toBe("red");
      expect(element.style.padding).toBe("0px");
      style.value = { backgroundColor: "blue", padding: "0" };
      expect(element.style.backgroundColor).toBe("blue");
      expect(element.style.padding).toBe("0px");
    });

    test("clears styles with a reactive object", () => {
      const style = reactive<Record<string, string | undefined>>({
        backgroundColor: "red",
        padding: "0",
      });
      const [element] = render(jsx("div", { style })) as [HTMLElement];
      expect(element.style.backgroundColor).toBe("red");
      expect(element.style.padding).toBe("0px");
      style.value = { backgroundColor: undefined, padding: "0" };
      expect(element.style.backgroundColor).toBe("");
      expect(element.style.padding).toBe("0px");
    });
  });

  test("sets the style attribute from a string", () => {
    const [element] = render(
      jsx("div", { style: "background-color: red; padding: 0" }),
    ) as [HTMLElement];
    expect(element.style.backgroundColor).toBe("red");
    expect(element.style.padding).toBe("0px");
  });

  describe("boolean string attributes", () => {
    describe.for(Array.from(BOOLEAN_STRING_ATTRIBUTES))("%s", (attribute) => {
      test("truthy value", () => {
        const [element] = render(jsx("div", { [attribute]: 1 })) as [
          HTMLElement,
        ];
        expect(element.getAttribute(attribute)).toBe("true");
      });

      test("falsy value", () => {
        const [element] = render(jsx("div", { [attribute]: 0 })) as [
          HTMLElement,
        ];
        expect(element.getAttribute(attribute)).toBe("false");
      });

      test("false", () => {
        const [element] = render(jsx("div", { [attribute]: "false" })) as [
          HTMLElement,
        ];
        expect(element.getAttribute(attribute)).toBe("false");
      });

      test("string value", () => {
        const [element] = render(jsx("div", { [attribute]: "page" })) as [
          HTMLElement,
        ];
        expect(element.getAttribute(attribute)).toBe("page");
      });
    });
  });

  test("sets an event listener", () => {
    const onclick = vi.fn();
    const [element] = render(jsx("div", { "on:click": onclick })) as [
      HTMLElement,
    ];
    element.click();
    expect(onclick).toHaveBeenCalled();
  });

  test("adds a child element", () => {
    const [element] = render(jsx("div", { children: jsx("span", {}) })) as [
      HTMLElement,
    ];
    expect(element.childNodes.length).toBe(1);
    expect(element.children[0]?.tagName).toBe("SPAN");
  });

  test("adds a child component", () => {
    const Component = ({ name }: { name: string }) =>
      jsx("span", { children: `Hello ${name}` });
    const [element] = render(
      jsx("div", { children: jsx(Component, { name: "Test" }) }),
    ) as [HTMLElement];
    expect(element.childNodes.length).toBe(1);
    expect(element.children[0]?.tagName).toBe("SPAN");
    expect(element.children[0]?.textContent).toBe("Hello Test");
  });

  test("adds multiple children", () => {
    const [element] = render(
      jsx("div", { children: [jsx("span", {}), jsx("p", {})] }),
    ) as [HTMLElement];
    expect(element.childNodes.length).toBe(2);
    expect(element.children[0]?.tagName).toBe("SPAN");
    expect(element.children[1]?.tagName).toBe("P");
  });

  test("adds a text child node", () => {
    const [element] = render(jsx("div", { children: "Hello World" })) as [
      HTMLElement,
    ];
    expect(element.childNodes.length).toBe(1);
    expect(element.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(element.childNodes[0]?.textContent).toBe("Hello World");
  });

  test("adds a numberic child node", () => {
    const [element] = render(jsx("div", { children: 2 })) as [HTMLElement];
    expect(element.childNodes.length).toBe(1);
    expect(element.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(element.childNodes[0]?.textContent).toBe("2");
  });

  test("adds a numberic child node with value 0", () => {
    const [element] = render(jsx("div", { children: 0 })) as [HTMLElement];
    expect(element.childNodes.length).toBe(1);
    expect(element.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(element.childNodes[0]?.textContent).toBe("0");
  });

  test("ignores a boolean child node", () => {
    const [element] = render(jsx("div", { children: [true] })) as [HTMLElement];
    expect(element.childNodes.length).toBe(0);
  });

  test("ignores a null child node", () => {
    const [element] = render(jsx("div", { children: [null] })) as [HTMLElement];
    expect(element.childNodes.length).toBe(0);
  });

  test("ignores an undefined child node", () => {
    const [element] = render(jsx("div", { children: [undefined] })) as [
      HTMLElement,
    ];
    expect(element.childNodes.length).toBe(0);
  });

  test("throws for an invalid child node", () => {
    // @ts-expect-error Intentionally invalid children
    expect(() => render(jsx("div", { children: { foo: "bar" } }))).toThrowError(
      "Invalid node",
    );
  });

  test("renders a class component", () => {
    class Component {
      name: string;

      constructor({ name }: { name: string }) {
        this.name = name;
      }

      render() {
        return jsx("span", { children: `Hello ${this.name}` });
      }
    }
    const [element] = render(jsx(Component, { name: "Test" })) as [HTMLElement];
    expect(element.tagName).toBe("SPAN");
    expect(element.textContent).toBe("Hello Test");
  });
});

describe("hydrate", () => {
  test("inserts a disconnected DOM node", () => {
    const container = document.createElement("div");
    const node = document.createElement("span");
    hydrate(node, container);
    expect(node.parentNode).toEqual(container);
  });
});
