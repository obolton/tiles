import { BaseStore } from "@/utils/stores";
import type { StoreInterface } from "@/utils/stores";
import type { JSX } from "./jsx";

interface MutableRange {
  store: StoreInterface<JSX.Node>;
  container: Element;
  anchor: Node;
  length: number;
}

function isEmptyNode(node: JSX.Node) {
  return (
    typeof node === "boolean" || typeof node === "undefined" || node === null
  );
}

function isTextNode(node: JSX.Node) {
  return (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  );
}

function isElementNode(node: JSX.Node) {
  return typeof node === "object" && node !== null && "type" in node;
}

function toNodeArray(node: JSX.Node) {
  if (isEmptyNode(node)) {
    return [];
  } else if (Array.isArray(node)) {
    return node;
  } else {
    return [node];
  }
}

function getNextSiblings(node: Node, count: number) {
  const nodes = [];
  let siblingNode = node.nextSibling;
  for (let i = 0; i < count; i++) {
    if (!siblingNode) {
      return nodes;
    }
    nodes.push(siblingNode);
    siblingNode = siblingNode.nextSibling;
  }
  return nodes;
}

function setAttributes<T extends keyof JSX.IntrinsicElements>(
  element: Element,
  properties: JSX.Properties<T>,
) {
  for (const [name, value] of Object.entries(properties)) {
    if (name === "children") {
      continue;
    }
    if (name.startsWith("on") && typeof value === "function") {
      element.addEventListener(
        name.slice(2).toLowerCase(),
        value as EventListener,
      );
    } else {
      setAttribute(element, name, value);
    }
  }
}

function setAttribute(element: Element, name: string, value: unknown) {
  const mappedName = name === "className" ? "class" : name;

  if (value instanceof BaseStore) {
    setAttribute(element, name, value.value);
    value.subscribe(() => setAttribute(element, name, value.value));
  } else if (
    value === null ||
    typeof value === "undefined" ||
    value === false
  ) {
    element.removeAttribute(mappedName);
  } else if (
    mappedName === "style" &&
    typeof value === "object" &&
    element instanceof HTMLElement
  ) {
    Object.assign(element.style, value);
  } else if (value === true) {
    element.setAttribute(mappedName, "");
  } else if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    element.setAttribute(mappedName, value.toString());
  } else {
    throw new Error(`Invalid attribute value for "${name}": ${value}`);
  }
}

function ensureTextNode(node: Node, value: string) {
  if (node instanceof Text) {
    return node;
  }
  const textNode = document.createTextNode(value);
  node.parentNode?.replaceChild(textNode, node);
  return textNode;
}

function ensureElementNode(node: Node, tagName: string) {
  if (node instanceof Element && node.tagName.toLowerCase() === tagName) {
    return node;
  }
  const element = document.createElement(tagName);
  node.parentNode?.replaceChild(element, node);
  return element;
}

function hydrateTextNode(value: string, container: Element, index: number) {
  const node = container.childNodes[index];

  if (node) {
    const textNode = ensureTextNode(node, value);
    const content = textNode.data;

    if (content.length > value.length && content.startsWith(value)) {
      textNode.splitText(value.length);
    } else {
      textNode.data = value;
    }
  } else {
    const textNode = document.createTextNode(value);
    container.appendChild(textNode);
  }

  return 1;
}

function hydrateElementNode(
  node: JSX.Element,
  container: Element,
  index: number,
) {
  if (typeof node.type === "string") {
    return hydrateDOMElement(node.type, node.properties, container, index);
  }
  return hydrateNode(node.type(node.properties), container, index);
}

function hydrateDOMElement(
  tagName: string,
  attributes: { children?: JSX.Node },
  container: Element,
  index: number,
) {
  const node = container.childNodes[index];

  if (node) {
    const element = ensureElementNode(node, tagName);
    setAttributes(element, attributes);
    hydrateFragment(toNodeArray(attributes.children), element, 0);
  } else {
    const element = document.createElement(tagName);
    setAttributes(element, attributes);
    const childNode = renderFragment(toNodeArray(attributes.children));
    if (childNode) {
      element.appendChild(childNode);
    }
    container.appendChild(element);
  }

  return 1;
}

function hydrateFragment(nodes: JSX.Node[], container: Element, start: number) {
  let length = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    length += hydrateNode(node, container, start + length);
  }
  return length;
}

function hydrateStoreNode(
  store: StoreInterface<JSX.Node>,
  container: Element,
  index: number,
) {
  let length = hydrateNode(store.value, container, index);
  let anchor;
  if (length === 0) {
    anchor = createPlaceholderNode();
    container.insertBefore(anchor, container.childNodes[index] ?? null);
    length = 1;
  } else {
    anchor = container.childNodes[index]!;
  }
  const range: MutableRange = {
    store,
    container,
    anchor,
    length,
  };
  store.subscribe(() => updateRange(range));
  return length;
}

// Potential improvement: use anchor node instead of indexing into container
function hydrateNode(
  node: JSX.Node,
  container: Element,
  index: number,
): number {
  if (isEmptyNode(node)) {
    return 0;
  }

  if (isTextNode(node)) {
    return hydrateTextNode(node.toString(), container, index);
  }

  if (isElementNode(node)) {
    return hydrateElementNode(node, container, index);
  }

  if (Array.isArray(node)) {
    return hydrateFragment(node, container, index);
  }

  if (node instanceof BaseStore) {
    return hydrateStoreNode(node, container, index);
  }

  throw new Error("Hydration error: invalid node");
}

function createPlaceholderNode() {
  return document.createComment("");
}

function updateRange(range: MutableRange) {
  const existingNodes = [
    range.anchor,
    ...getNextSiblings(range.anchor, range.length - 1),
  ];

  const nextNode = existingNodes[existingNodes.length - 1]?.nextSibling ?? null;

  for (const existingNode of existingNodes) {
    range.container.removeChild(existingNode);
  }

  const node = render(range.store.value);
  if (node instanceof Element || node instanceof Text) {
    range.anchor = node;
    range.length = 1;
    range.container.insertBefore(node, nextNode);
  } else if (node instanceof DocumentFragment && node.firstChild) {
    range.anchor = node.firstChild;
    range.length = node.childNodes.length;
    range.container.insertBefore(node, nextNode);
  } else {
    const anchor = createPlaceholderNode();
    range.anchor = anchor;
    range.length = 1;
    range.container.insertBefore(anchor, nextNode);
  }
}

function renderDOMElement(node: JSX.Element<keyof JSX.IntrinsicElements>) {
  const element = document.createElement(node.type);

  setAttributes(element, node.properties);

  const children = node.properties.children;
  if (children !== null && typeof children !== "undefined") {
    const childNode = render(children);
    if (childNode) {
      element.appendChild(childNode);
    }
  }

  return element;
}

function renderTextNode(value: string) {
  return document.createTextNode(value);
}

function renderElement(node: JSX.Element) {
  if (typeof node.type === "string") {
    return renderDOMElement(node);
  } else {
    return render(node.type(node.properties));
  }
}

function renderFragment(nodes: JSX.Node[]) {
  if (nodes.length === 0) {
    return null;
  }

  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    const renderedNode = render(node);
    if (renderedNode) {
      fragment.appendChild(renderedNode);
    }
  }
  return fragment;
}

export function render(node: JSX.Node): Node | null {
  if (isEmptyNode(node)) {
    return null;
  }

  if (isTextNode(node)) {
    return renderTextNode(node.toString());
  }

  if (isElementNode(node)) {
    return renderElement(node);
  }

  if (Array.isArray(node)) {
    return renderFragment(node);
  }

  throw new Error("Invalid node");
}

export function hydrate(node: JSX.Node, container: Element) {
  hydrateNode(node, container, 0);
}
