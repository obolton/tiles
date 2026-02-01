import { isReactive } from "@/utils/reactivity";
import { transformCSSProperty } from "@/utils/css";
import { isClassComponent } from "./jsx";
import { BOOLEAN_STRING_ATTRIBUTES } from "./attributes";
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
  return typeof node === "boolean" || node === undefined || node === null;
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

function getNamespace(tagName: string) {
  switch (tagName.toLowerCase()) {
    case "svg":
      return SVG_NAMESPACE;
    case "math":
      return MATHML_NAMESPACE;
    default:
      return null;
  }
}

function createElement(tagName: string, namespace?: string | null) {
  return namespace
    ? document.createElementNS(namespace, tagName)
    : document.createElement(tagName);
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
  properties: Record<string, unknown>,
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
  } else if (value === null || typeof value === "undefined") {
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
  } else if (
    mappedName === "style" &&
    (element instanceof HTMLElement || element instanceof SVGElement) &&
    typeof value === "object"
  ) {
    for (const [styleProperty, styleValue] of Object.entries(value)) {
      const transformedProperty = transformCSSProperty(styleProperty);
      if (typeof styleValue === "string" || typeof styleValue === "number") {
        element.style.setProperty(transformedProperty, styleValue.toString());
      } else {
        element.style.removeProperty(transformedProperty);
      }
    }
  } else if (BOOLEAN_STRING_ATTRIBUTES.has(mappedName)) {
    element.setAttribute(
      mappedName,
      value && value !== "false" ? "true" : "false",
    );
  } else if (typeof value === "boolean") {
    if (value) {
      element.setAttribute(mappedName, "");
    } else {
      element.removeAttribute(mappedName);
    }
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
  const namespace = getNamespace(tagName);
  const element = createElement(tagName, namespace);
  node.parentNode?.replaceChild(element, node);
  return element;
}

function hydrateDOMNode(node: Node, container: Element, index: number) {
  if (node.parentNode !== container) {
    container.insertBefore(node, container.childNodes[index] ?? null);
  }
  return [node];
}

function hydrateTextNode(value: string, container: Element, index: number) {
  const node = container.childNodes[index];

  if (node) {
    const textNode = ensureTextNode(node, value);
    const content = textNode.data;

    if (content.length > value.length && content.startsWith(value)) {
      const sibling = textNode.splitText(value.length);
      return [textNode, sibling];
    }

    if (content !== value) {
      textNode.data = value;
    }

    return [textNode];
  } else {
    const textNode = document.createTextNode(value);
    container.appendChild(textNode);

    return [textNode];
  }
}

function hydrateElementNode(
  node: JSX.Element,
  container: Element,
  index: number,
  signal?: AbortSignal,
) {
  const { type, properties } = node;

  if (typeof type === "string") {
    return hydrateDOMElement(type, properties, container, index, signal);
  }

  if (isClassComponent(type)) {
    const instance = new type({ ...properties, signal });
    if (instance.hydrate) {
      return instance.hydrate(container, index);
    }
    return hydrateNode(instance.render(), container, index, signal);
  }

  return hydrateNode(type({ ...properties, signal }), container, index, signal);
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
    return [element];
  } else {
    const namespace = getNamespace(tagName);
    const element = createElement(tagName, namespace);
    setAttributes(element, attributes, signal);
    const childNodes = renderFragment(
      toNodeArray(attributes.children),
      namespace,
      signal,
    );
    element.append(...childNodes);

    if (attributes.ref) {
      attributes.ref(element);
    }
    container.appendChild(element);
    return [element];
  }
}

function hydrateFragment(
  nodes: JSX.Node[],
  container: Element,
  start: number,
  signal?: AbortSignal,
) {
  const hydrated: Node[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    hydrated.push(
      ...hydrateNode(node, container, start + hydrated.length, signal),
    );
  }
  return hydrated;
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
  const hydrated = hydrateNode(store.value, container, index, combinedSignal);
  let anchor = hydrated[0];
  if (!anchor) {
    anchor = createPlaceholderNode();
    container.insertBefore(anchor, container.childNodes[index] ?? null);
    hydrated.push(anchor);
  }
  const range: MutableRange = {
    store,
    anchor,
    length: hydrated.length,
    abort,
  };
  store.subscribe(() => updateRange(range, undefined, signal), signal);
  return hydrated;
}

// Potential improvement: use anchor node instead of indexing into container
export function hydrateNode(
  node: JSX.Node,
  container: Element,
  index: number,
  signal?: AbortSignal,
): Node[] {
  if (isEmptyNode(node)) {
    return [];
  }

  if (node instanceof Node) {
    return hydrateDOMNode(node, container, index);
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

export function createPlaceholderNode(): Comment {
  return document.createComment("");
}

function updateRange(
  range: MutableRange,
  namespace?: string | null,
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

  const nodes = render(range.store.value, namespace, combinedSignal);
  if (nodes.length === 0) {
    nodes.push(createPlaceholderNode());
  }
  range.anchor = nodes[0]!;
  range.length = nodes.length;
  for (const node of nodes) {
    container?.insertBefore(node, nextNode);
  }
}

function renderDOMElement(
  node: JSX.Element<keyof JSX.IntrinsicElements>,
  namespace?: string | null,
  signal?: AbortSignal,
) {
  const { type, properties } = node;
  const newNamespace = getNamespace(type) ?? namespace;

  const element = createElement(type, newNamespace);

  setAttributes(element, properties, signal);

  const { children, ref } = properties;

  // Included content from a different namespace
  const childrenNamespace =
    type === "foreignObject" ? XHTML_NAMESPACE : newNamespace;

  if (children !== null && children !== undefined) {
    element.append(...render(children, childrenNamespace, signal));
  }

  if (ref) {
    // TODO: Improve types
    // @ts-ignore
    ref(element);
  }

  return [element];
}

function renderTextNode(value: string) {
  return [document.createTextNode(value)];
}

function renderElement(
  node: JSX.Element,
  namespace?: string | null,
  signal?: AbortSignal,
) {
  const { type, properties } = node;

  if (typeof type === "string") {
    return renderDOMElement(node, namespace, signal);
  }

  if (isClassComponent(type)) {
    const instance = new type({ ...properties, signal });
    return render(instance.render(), namespace, signal);
  }

  return render(type({ ...properties, signal }), namespace, signal);
}

function renderFragment(
  nodes: JSX.Node[],
  namespace?: string | null,
  signal?: AbortSignal,
) {
  const renderedNodes: Node[] = [];
  for (const node of nodes) {
    renderedNodes.push(...render(node, namespace, signal));
  }
  return renderedNodes;
}

function renderStoreNode(
  store: Reactive<JSX.Node>,
  namespace?: string | null,
  signal?: AbortSignal,
) {
  const abort = new AbortController();
  const combinedSignal = signal
    ? AbortSignal.any([signal, abort.signal])
    : abort.signal;

  const nodes = render(store.value, namespace, combinedSignal);

  if (nodes.length === 0) {
    nodes.push(createPlaceholderNode());
  }

  const range: MutableRange = {
    store,
    anchor: nodes[0]!,
    length: nodes.length,
    abort,
  };
  store.subscribe(() => updateRange(range, namespace, signal), signal);
  return nodes;
}

export function render(
  node: JSX.Node,
  namespace?: string | null,
  signal?: AbortSignal,
): Node[] {
  if (node instanceof Node) {
    return [node];
  }

  if (isEmptyNode(node)) {
    return [];
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

  throw new Error("Invalid node");
}

export function hydrate(node: JSX.Node, container: Element) {
  hydrateNode(node, container, 0);
}
