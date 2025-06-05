import { isReactive } from "@/utils/reactivity";
import { serializeStyles } from "@/utils/css";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "./jsx";

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";

interface MutableRange {
  store: Reactive<JSX.Node>;
  anchor: Node;
  length: number;
  abort: AbortController;
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

function setAttributes<T extends Element>(
  element: T,
  properties: JSX.Attributes<T>,
  signal?: AbortSignal,
) {
  for (const [name, value] of Object.entries(properties)) {
    if (name === "children" || name === "ref") {
      continue;
    }
    if (name.startsWith("on:") && typeof value === "function") {
      element.addEventListener(
        name.slice(3).toLowerCase(),
        value as EventListener,
        { signal },
      );
    } else if (name.startsWith("on") && typeof value === "function") {
      element.addEventListener(
        name.slice(2).toLowerCase(),
        value as EventListener,
        { signal },
      );
    } else if (name.startsWith("$")) {
      const property = name.slice(1) as keyof T;
      if (property in element) {
        element[property] = value as T[typeof property];
      }
    } else {
      setAttribute(element, name, value, signal);
    }
  }
}

function setAttribute(
  element: Element,
  name: string,
  value: unknown,
  signal?: AbortSignal,
) {
  if (name === "signal") {
    return;
  }
  const mappedName = name === "className" ? "class" : name;

  if (isReactive(value)) {
    setAttribute(element, name, value.value);
    value.subscribe(() => setAttribute(element, name, value.value), signal);
  } else if (
    value === null ||
    typeof value === "undefined" ||
    value === false
  ) {
    element.removeAttribute(mappedName);
  } else if (mappedName === "classList" && Array.isArray(value)) {
    for (const className of element.classList.values()) {
      if (!value.includes(className)) {
        element.classList.remove(className);
      }
    }
    for (const className of value) {
      if (isReactive(className)) {
        let value = className.value;
        if (typeof value === "string") {
          element.classList.add(value);
        }
        className.subscribe(() => {
          if (typeof value === "string") {
            element.classList.remove(value);
          }
          value = className.value;
          if (typeof value === "string") {
            element.classList.add(value);
          }
        }, signal);
      } else if (typeof className === "string") {
        element.classList.add(className);
      }
    }
  } else if (mappedName === "classList" && typeof value === "object") {
    for (const className of element.classList.values()) {
      if (
        !(className in value) ||
        !(value as Record<string, unknown>)[className]
      ) {
        element.classList.remove(className);
      }
    }
    for (const [className, enabled] of Object.entries(value)) {
      if (isReactive(enabled)) {
        if (enabled.value) {
          element.classList.add(className);
        }
        enabled.subscribe(() => {
          if (enabled.value) {
            element.classList.add(className);
          } else {
            element.classList.remove(className);
          }
        }, signal);
      } else if (enabled) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }
  } else if (mappedName === "style" && typeof value === "object") {
    element.setAttribute(mappedName, serializeStyles(value));
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
    } else if (content !== value) {
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
  signal?: AbortSignal,
) {
  if (typeof node.type === "string") {
    return hydrateDOMElement(
      node.type,
      node.properties,
      container,
      index,
      signal,
    );
  }
  return hydrateNode(
    node.type({ ...node.properties, signal }),
    container,
    index,
    signal,
  );
}

function hydrateDOMElement(
  tagName: string,
  attributes: { children?: JSX.Node; ref?: JSX.Ref<unknown> },
  container: Element,
  index: number,
  signal?: AbortSignal,
) {
  const node = container.childNodes[index];

  if (node) {
    const element = ensureElementNode(node, tagName);
    setAttributes(element, attributes, signal);
    hydrateFragment(toNodeArray(attributes.children), element, 0, signal);
    if (attributes.ref) {
      attributes.ref(element);
    }
  } else {
    const element = document.createElement(tagName);
    setAttributes(element, attributes, signal);
    const childNode = renderFragment(
      toNodeArray(attributes.children),
      undefined,
      signal,
    );
    if (childNode) {
      element.appendChild(childNode);
    }
    if (attributes.ref) {
      attributes.ref(element);
    }
    container.appendChild(element);
  }

  return 1;
}

function hydrateFragment(
  nodes: JSX.Node[],
  container: Element,
  start: number,
  signal?: AbortSignal,
) {
  let length = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    length += hydrateNode(node, container, start + length, signal);
  }
  return length;
}

function hydrateStoreNode(
  store: Reactive<JSX.Node>,
  container: Element,
  index: number,
  signal?: AbortSignal,
) {
  const abort = new AbortController();
  const storeSignal = abort.signal;
  const combinedSignal = signal
    ? AbortSignal.any([signal, storeSignal])
    : storeSignal;
  let length = hydrateNode(store.value, container, index, combinedSignal);
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
    anchor,
    length,
    abort,
  };
  store.subscribe(() => updateRange(range, undefined, signal), signal);
  return length;
}

// Potential improvement: use anchor node instead of indexing into container
function hydrateNode(
  node: JSX.Node,
  container: Element,
  index: number,
  signal?: AbortSignal,
): number {
  if (isEmptyNode(node)) {
    return 0;
  }

  if (isTextNode(node)) {
    return hydrateTextNode(node.toString(), container, index);
  }

  if (isElementNode(node)) {
    return hydrateElementNode(node, container, index, signal);
  }

  if (Array.isArray(node)) {
    return hydrateFragment(node, container, index, signal);
  }

  if (isReactive(node)) {
    return hydrateStoreNode(node, container, index, signal);
  }

  throw new Error("Hydration error: invalid node");
}

function createPlaceholderNode() {
  return document.createComment("");
}

function updateRange(
  range: MutableRange,
  namespace?: string,
  signal?: AbortSignal,
) {
  range.abort.abort(null);
  range.abort = new AbortController();
  const combinedSignal = signal
    ? AbortSignal.any([signal, range.abort.signal])
    : range.abort.signal;

  const existingNodes = [
    range.anchor,
    ...getNextSiblings(range.anchor, range.length - 1),
  ];

  const nextNode = existingNodes[existingNodes.length - 1]?.nextSibling ?? null;

  const container = range.anchor.parentNode;
  for (const existingNode of existingNodes) {
    container?.removeChild(existingNode);
  }

  const node = render(range.store.value, namespace, combinedSignal);
  if (node instanceof Element || node instanceof Text) {
    range.anchor = node;
    range.length = 1;
    container?.insertBefore(node, nextNode);
  } else if (node instanceof DocumentFragment && node.firstChild) {
    range.anchor = node.firstChild;
    range.length = node.childNodes.length;
    container?.insertBefore(node, nextNode);
  } else {
    const anchor = createPlaceholderNode();
    range.anchor = anchor;
    range.length = 1;
    container?.insertBefore(anchor, nextNode);
  }
}

function renderDOMElement(
  node: JSX.Element<keyof JSX.IntrinsicElements>,
  namespace?: string,
  signal?: AbortSignal,
) {
  switch (node.type) {
    case "svg":
      namespace = SVG_NAMESPACE;
      break;
    case "math":
      namespace = MATHML_NAMESPACE;
      break;
  }

  const element = namespace
    ? document.createElementNS(namespace, node.type)
    : document.createElement(node.type);

  setAttributes(element, node.properties, signal);

  const { children, ref } = node.properties;

  // Included content from a different namespace
  if (node.type === "foreignObject") {
    namespace = XHTML_NAMESPACE;
  }

  if (children !== null && typeof children !== "undefined") {
    const childNode = render(children, namespace, signal);
    if (childNode) {
      element.appendChild(childNode);
    }
  }

  if (ref) {
    // TODO: Improve types
    ref(element);
  }

  return element;
}

function renderTextNode(value: string) {
  return document.createTextNode(value);
}

function renderElement(
  node: JSX.Element,
  namespace?: string,
  signal?: AbortSignal,
) {
  if (typeof node.type === "string") {
    return renderDOMElement(node, namespace, signal);
  } else {
    return render(node.type({ ...node.properties, signal }), namespace, signal);
  }
}

function renderFragment(
  nodes: JSX.Node[],
  namespace?: string,
  signal?: AbortSignal,
) {
  if (nodes.length === 0) {
    return null;
  }

  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    const renderedNode = render(node, namespace, signal);
    if (renderedNode) {
      fragment.appendChild(renderedNode);
    }
  }
  return fragment;
}

function renderStoreNode(
  store: Reactive<JSX.Node>,
  namespace?: string,
  signal?: AbortSignal,
) {
  const abort = new AbortController();
  const combinedSignal = signal
    ? AbortSignal.any([signal, abort.signal])
    : abort.signal;

  const container = document.createDocumentFragment();
  const node = render(store.value, namespace, combinedSignal);

  let range: MutableRange;
  if (node instanceof Element || node instanceof Text) {
    range = {
      store,
      anchor: node,
      length: 1,
      abort,
    };
    container.appendChild(node);
  } else if (node instanceof DocumentFragment && node.firstChild) {
    range = {
      store,
      anchor: node.firstChild,
      length: node.childNodes.length,
      abort,
    };
    container.appendChild(node);
  } else {
    range = {
      store,
      anchor: createPlaceholderNode(),
      length: 1,
      abort,
    };
    container.appendChild(range.anchor);
  }

  store.subscribe(() => updateRange(range, namespace, signal), signal);
  return container;
}

export function render(
  node: JSX.Node,
  namespace?: string,
  signal?: AbortSignal,
): Node | null {
  if (isEmptyNode(node)) {
    return null;
  }

  if (isTextNode(node)) {
    return renderTextNode(node.toString());
  }

  if (isElementNode(node)) {
    return renderElement(node, namespace, signal);
  }

  if (Array.isArray(node)) {
    return renderFragment(node, namespace, signal);
  }

  if (isReactive(node)) {
    return renderStoreNode(node, namespace, signal);
  }

  if (node instanceof Node) {
    return node;
  }

  throw new Error("Invalid node");
}

export function hydrate(node: JSX.Node, container: Element) {
  hydrateNode(node, container, 0);
}
