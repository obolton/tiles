import { describe, expect, test, vi } from "vitest";
import { jsx } from "../jsx";
import type { JSX } from "../jsx";
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

  test("reuses an existing matching element", () => {
    const container = document.createElement("div");
    const existing = document.createElement("span");
    container.appendChild(existing);
    hydrate(jsx("span", {}), container);
    expect(container.children.length).toBe(1);
    expect(container.firstElementChild).toBe(existing);
  });

  test("replaces an existing element when the tag does not match", () => {
    const container = document.createElement("div");
    const existing = document.createElement("span");
    container.appendChild(existing);
    hydrate(jsx("p", {}), container);
    expect(container.children.length).toBe(1);
    expect(container.firstElementChild?.tagName).toBe("P");
    expect(container.firstElementChild).not.toBe(existing);
  });

  test("creates an element when the container is empty", () => {
    const container = document.createElement("div");
    hydrate(jsx("span", {}), container);
    expect(container.children.length).toBe(1);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  test("sets attributes on the hydrated element", () => {
    const container = document.createElement("div");
    const existing = document.createElement("span");
    container.appendChild(existing);
    hydrate(jsx("span", { id: "test", className: "foo" }), container);
    expect(existing.id).toBe("test");
    expect(existing.className).toBe("foo");
  });

  test("calls the ref callback for the hydrated element", () => {
    const container = document.createElement("div");
    const existing = document.createElement("span");
    container.appendChild(existing);
    const ref = vi.fn();
    hydrate(jsx("span", { ref }), container);
    expect(ref).toHaveBeenCalledWith(existing);
  });

  test("reuses a matching text node", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    const text = document.createTextNode("hello");
    span.appendChild(text);
    container.appendChild(span);
    hydrate(jsx("span", { children: "hello" }), container);
    expect(span.firstChild).toBe(text);
    expect(text.nodeValue).toBe("hello");
  });

  test("updates a text node when the content differs", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    const text = document.createTextNode("old");
    span.appendChild(text);
    container.appendChild(span);
    hydrate(jsx("span", { children: "new" }), container);
    expect(span.firstChild).toBe(text);
    expect(text.nodeValue).toBe("new");
  });

  test("splits a merged text node into adjacent children", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    span.appendChild(document.createTextNode("hello world"));
    container.appendChild(span);
    hydrate(jsx("span", { children: ["hello ", "world"] }), container);
    expect(span.childNodes.length).toBe(2);
    expect(span.childNodes[0]?.nodeValue).toBe("hello ");
    expect(span.childNodes[1]?.nodeValue).toBe("world");
  });

  test("hydrates a function component", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    span.appendChild(document.createTextNode("Hello"));
    container.appendChild(span);
    const Component = ({ name }: { name: string }) =>
      jsx("span", { children: `Hello ${name}` });
    hydrate(jsx(Component, { name: "World" }), container);
    expect(container.firstElementChild).toBe(span);
    expect(span.firstChild?.nodeValue).toBe("Hello World");
  });

  test("hydrates a class component", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    span.appendChild(document.createTextNode("Hello"));
    container.appendChild(span);
    class Component {
      name: string;
      constructor({ name }: { name: string }) {
        this.name = name;
      }
      render() {
        return jsx("span", { children: `Hello ${this.name}` });
      }
    }
    hydrate(jsx(Component, { name: "World" }), container);
    expect(container.firstElementChild).toBe(span);
    expect(span.firstChild?.nodeValue).toBe("Hello World");
  });

  test("uses the custom hydrate method on a class component", () => {
    const container = document.createElement("div");
    const existing = document.createElement("span");
    container.appendChild(existing);
    const customHydrate = vi.fn((_target: Element, _index: number) => [
      existing as Node,
    ]);
    class Component {
      hydrate(target: Element, index: number) {
        return customHydrate(target, index);
      }
      render() {
        return jsx("span", {});
      }
    }
    hydrate(jsx(Component, {}), container);
    expect(customHydrate).toHaveBeenCalledWith(container, 0);
  });

  test("hydrates an array of children", () => {
    const container = document.createElement("div");
    const existingSpan = document.createElement("span");
    existingSpan.appendChild(document.createTextNode("a"));
    const existingP = document.createElement("p");
    existingP.appendChild(document.createTextNode("b"));
    container.append(existingSpan, existingP);
    hydrate(
      [jsx("span", { children: "a" }), jsx("p", { children: "b" })],
      container,
    );
    expect(container.children.length).toBe(2);
    expect(container.children[0]).toBe(existingSpan);
    expect(container.children[1]).toBe(existingP);
  });

  test("hydrates the initial value of a reactive node", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    span.appendChild(document.createTextNode("a"));
    container.appendChild(span);
    const value = reactive<JSX.Node>(jsx("span", { children: "a" }));
    hydrate(value, container);
    expect(container.firstElementChild).toBe(span);
    expect(span.firstChild?.nodeValue).toBe("a");
  });

  test("re-renders when the reactive value changes", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    span.appendChild(document.createTextNode("a"));
    container.appendChild(span);
    const value = reactive<JSX.Node>(jsx("span", { children: "a" }));
    hydrate(value, container);
    value.value = jsx("p", { children: "b" });
    expect(container.firstElementChild?.tagName).toBe("P");
    expect(container.firstElementChild?.firstChild?.nodeValue).toBe("b");
  });

  describe("namespaces", () => {
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

    test("creates SVG elements in the SVG namespace", () => {
      const container = document.createElement("div");
      hydrate(jsx("svg", {}), container);
      expect(container.firstElementChild?.namespaceURI).toBe(SVG_NAMESPACE);
    });

    test("inherits the SVG namespace when replacing a mismatched child", () => {
      const container = document.createElement("div");
      const svg = document.createElementNS(SVG_NAMESPACE, "svg");
      svg.appendChild(document.createElementNS(SVG_NAMESPACE, "rect"));
      container.appendChild(svg);
      hydrate(jsx("svg", { children: jsx("circle", {}) }), container);
      const child = svg.firstElementChild;
      expect(child?.tagName.toLowerCase()).toBe("circle");
      expect(child?.namespaceURI).toBe(SVG_NAMESPACE);
    });

    test("uses the XHTML namespace for foreignObject children", () => {
      const container = document.createElement("div");
      hydrate(
        jsx("svg", {
          children: jsx("foreignObject", {
            children: jsx("div", {}),
          }),
        }),
        container,
      );
      expect(container.querySelector("div")?.namespaceURI).toBe(XHTML_NAMESPACE);
    });
  });
});
