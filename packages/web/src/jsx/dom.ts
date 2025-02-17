import type { JSX } from "./jsx";

function renderElement<P>({ type, properties, children }: JSX.Element<P>) {
  const element = document.createElement(type);

  if (properties) {
    for (const [key, value] of Object.entries<JSX.Node>(properties)) {
      if (key.startsWith("on") && typeof value === "function") {
        element.addEventListener(
          key.slice(2).toLowerCase(),
          value as EventListener,
        );
      } else if (value !== null && typeof value !== "undefined") {
        switch (key) {
          case "className":
            element.setAttribute("class", value.toString());
            break;
          default:
            element.setAttribute(key, value.toString());
            break;
        }
      }
    }
  }

  if (!(children === null || typeof children === "undefined")) {
    const childNode = render(children);
    if (childNode) {
      element.appendChild(childNode);
    }
  }

  return element;
}

function renderFragment(nodes: JSX.Node[]) {
  const fragment = document.createDocumentFragment();

  for (const node of nodes) {
    const domNode = render(node);
    if (domNode) {
      fragment.appendChild(domNode);
    }
  }

  return fragment;
}

function renderTextNode(node: string | number | bigint) {
  return document.createTextNode(node.toString());
}

export function render<P>(node: JSX.Element<P>): HTMLElement;
export function render(node: JSX.Node[]): DocumentFragment;
export function render(node: string | number | bigint): Text;
export function render(node: boolean | null | undefined): null;
export function render(
  node: JSX.Node,
): HTMLElement | DocumentFragment | Text | null;

export function render(node: JSX.Node) {
  if (Array.isArray(node)) {
    return renderFragment(node);
  } else if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  ) {
    return renderTextNode(node);
  } else if (
    typeof node === "boolean" ||
    typeof node === "undefined" ||
    node === null
  ) {
    return null;
  } else if ("type" in node) {
    return renderElement(node);
  } else {
    throw new Error(`Invalid node: ${node}`);
  }
}
