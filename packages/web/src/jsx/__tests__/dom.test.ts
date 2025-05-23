import { describe, expect, test, vi } from "vitest";
import { jsx } from "../jsx";
import { render } from "../dom";

describe("render", () => {
  test("creates an element with the given type", () => {
    const element = render(jsx("div", {}));
    expect(element).toBeInstanceOf(HTMLElement);
    expect((element as HTMLElement).tagName).toBe("DIV");
  });

  test("sets the attributes of the element", () => {
    const element = render(
      jsx("div", { id: "test-id", className: "test-class" }),
    ) as HTMLElement;
    expect(element.id).toBe("test-id");
    expect(element.className).toBe("test-class");
  });

  test("sets the properties of the element", () => {
    const element = render(
      jsx("div", { $id: "test-id", $className: "test-class" }),
    ) as HTMLElement;
    expect(element.id).toBe("test-id");
    expect(element.className).toBe("test-class");
  });

  test("sets the style attribute from an object", () => {
    const element = render(
      jsx("div", { style: { backgroundColor: "red", padding: "0" } }),
    ) as HTMLElement;
    expect(element.style.backgroundColor).toBe("red");
    expect(element.style.padding).toBe("0px");
  });

  test("sets the style attribute from a string", () => {
    const element = render(
      jsx("div", { style: "background-color: red; padding: 0" }),
    ) as HTMLElement;
    expect(element.style.backgroundColor).toBe("red");
    expect(element.style.padding).toBe("0px");
  });

  test("sets an event listener", () => {
    const onclick = vi.fn();
    const element = render(jsx("div", { onclick })) as HTMLElement;
    element.click();
    expect(onclick).toHaveBeenCalled();
  });

  test("adds a child element", () => {
    const element = render(
      jsx("div", { children: jsx("span", {}) }),
    ) as HTMLElement;
    expect(element.childNodes.length).toBe(1);
    expect(element.children[0]?.tagName).toBe("SPAN");
  });

  test("adds a child component", () => {
    const Component = ({ name }: { name: string }) =>
      jsx("span", { children: `Hello ${name}` });
    const element = render(
      jsx("div", { children: jsx(Component, { name: "Test" }) }),
    ) as HTMLElement;
    expect(element.childNodes.length).toBe(1);
    expect(element.children[0]?.tagName).toBe("SPAN");
    expect(element.children[0]?.textContent).toBe("Hello Test");
  });

  test("adds multiple children", () => {
    const element = render(
      jsx("div", { children: [jsx("span", {}), jsx("p", {})] }),
    ) as HTMLElement;
    expect(element.childNodes.length).toBe(2);
    expect(element.children[0]?.tagName).toBe("SPAN");
    expect(element.children[1]?.tagName).toBe("P");
  });

  test("adds a text child node", () => {
    const element = render(
      jsx("div", { children: "Hello World" }),
    ) as HTMLElement;
    expect(element.childNodes.length).toBe(1);
    expect(element.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(element.childNodes[0]?.textContent).toBe("Hello World");
  });

  test("adds a numberic child node", () => {
    const element = render(jsx("div", { children: 2 })) as HTMLElement;
    expect(element.childNodes.length).toBe(1);
    expect(element.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(element.childNodes[0]?.textContent).toBe("2");
  });

  test("adds a numberic child node with value 0", () => {
    const element = render(jsx("div", { children: 0 })) as HTMLElement;
    expect(element.childNodes.length).toBe(1);
    expect(element.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(element.childNodes[0]?.textContent).toBe("0");
  });

  test("ignores a boolean child node", () => {
    const element = render(jsx("div", { children: [true] })) as HTMLElement;
    expect(element.childNodes.length).toBe(0);
  });

  test("ignores a null child node", () => {
    const element = render(jsx("div", { children: [null] })) as HTMLElement;
    expect(element.childNodes.length).toBe(0);
  });

  test("ignores an undefined child node", () => {
    const element = render(
      jsx("div", { children: [undefined] }),
    ) as HTMLElement;
    expect(element.childNodes.length).toBe(0);
  });

  test("throws for an invalid child node", () => {
    // @ts-expect-error Intentionally invalid children
    expect(() => render(jsx("div", { children: { foo: "bar" } }))).toThrowError(
      "Invalid node",
    );
  });
});
