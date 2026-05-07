import { isReactive } from "@/utils/reactivity";
import { isClassComponent } from "./jsx";
import {
  isEmptyNode,
  isTextNode,
  isElementNode,
  toNodeArray,
} from "./node-types";
import {
  BOOLEAN_STRING_ATTRIBUTES,
  applyClassList,
  applyStyleObject,
  mapAttributeName,
} from "./attributes";
import type { ClassList, StyleDeclaration } from "./html-attributes";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "./jsx";

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";

export interface RenderContext {
  namespace?: string | null;
  signal?: AbortSignal;
}

interface MutableRange {
  store: Reactive<JSX.Node>;
  anchor: Node;
  length: number;
  abort: AbortController;
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

function combineSignal(
  context: RenderContext,
  signal: AbortSignal,
): RenderContext {
  return {
    ...context,
    signal: context.signal
      ? AbortSignal.any([context.signal, signal])
      : signal,
  };
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
  const mappedName = mapAttributeName(name);

  if (isReactive(value)) {
    setAttribute(element, name, value.value);
    value.subscribe(() => setAttribute(element, name, value.value), signal);
  } else if (value === null || typeof value === "undefined") {
    element.removeAttribute(mappedName);
  } else if (mappedName === "classList" && typeof value === "object") {
    applyClassList(element, value as ClassList, signal);
  } else if (
    mappedName === "style" &&
    (element instanceof HTMLElement || element instanceof SVGElement) &&
    typeof value === "object"
  ) {
    applyStyleObject(element, value as StyleDeclaration, signal);
  } else if (BOOLEAN_STRING_ATTRIBUTES.has(mappedName)) {
    element.setAttribute(
      mappedName,
      typeof value === "string" ? value : value ? "true" : "false",
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

function ensureElementNode(
  node: Node,
  tagName: string,
  namespace?: string | null,
) {
  if (node instanceof Element && node.tagName.toLowerCase() === tagName) {
    return node;
  }
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
      textNode.splitText(value.length);
      return [textNode];
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
  context: RenderContext,
) {
  const { type, properties } = node;

  if (typeof type === "string") {
    return hydrateDOMElement(type, properties, container, index, context);
  }

  if (isClassComponent(type)) {
    const instance = new type({ ...properties, signal: context.signal });
    if (instance.hydrate) {
      return instance.hydrate(container, index);
    }
    return hydrateNode(instance.render(), container, index, context);
  }

  return hydrateNode(
    type({ ...properties, signal: context.signal }),
    container,
    index,
    context,
  );
}

function hydrateDOMElement(
  tagName: string,
  attributes: { children?: JSX.Node; ref?: JSX.Ref<unknown> },
  container: Element,
  index: number,
  context: RenderContext,
) {
  const elementNamespace = getNamespace(tagName) ?? context.namespace;
  const childrenContext: RenderContext = {
    ...context,
    namespace:
      tagName === "foreignObject" ? XHTML_NAMESPACE : elementNamespace,
  };

  const node = container.childNodes[index];

  if (node) {
    const element = ensureElementNode(node, tagName, elementNamespace);
    setAttributes(element, attributes, context.signal);
    hydrateFragment(
      toNodeArray(attributes.children),
      element,
      0,
      childrenContext,
    );
    if (attributes.ref) {
      attributes.ref(element);
    }
    return [element];
  } else {
    const element = createElement(tagName, elementNamespace);
    setAttributes(element, attributes, context.signal);
    const childNodes = renderFragment(
      toNodeArray(attributes.children),
      childrenContext,
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
  context: RenderContext,
) {
  const hydrated: Node[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    hydrated.push(
      ...hydrateNode(node, container, start + hydrated.length, context),
    );
  }
  return hydrated;
}

function hydrateReactiveNode(
  store: Reactive<JSX.Node>,
  container: Element,
  index: number,
  context: RenderContext,
) {
  const abort = new AbortController();
  const childContext = combineSignal(context, abort.signal);
  const hydrated = hydrateNode(store.value, container, index, childContext);
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
  store.subscribe(() => updateRange(range, context), context.signal);
  return hydrated;
}

// Potential improvement: use anchor node instead of indexing into container
export function hydrateNode(
  node: JSX.Node,
  container: Element,
  index: number,
  context: RenderContext = {},
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
    return hydrateElementNode(node, container, index, context);
  }

  if (Array.isArray(node)) {
    return hydrateFragment(node, container, index, context);
  }

  if (isReactive(node)) {
    return hydrateReactiveNode(node, container, index, context);
  }

  throw new Error("Hydration error: invalid node");
}

export function createPlaceholderNode(): Comment {
  return document.createComment("");
}

function updateRange(range: MutableRange, context: RenderContext) {
  range.abort.abort(null);
  range.abort = new AbortController();
  const childContext = combineSignal(context, range.abort.signal);

  const existingNodes = [
    range.anchor,
    ...getNextSiblings(range.anchor, range.length - 1),
  ];

  const nextNode = existingNodes[existingNodes.length - 1]?.nextSibling ?? null;

  const container = range.anchor.parentNode;
  for (const existingNode of existingNodes) {
    container?.removeChild(existingNode);
  }

  const nodes = render(range.store.value, childContext);
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
  context: RenderContext,
) {
  const { type, properties } = node;
  const elementNamespace = getNamespace(type) ?? context.namespace;

  const element = createElement(type, elementNamespace);

  setAttributes(element, properties, context.signal);

  const { children, ref } = properties;

  // Included content from a different namespace
  const childrenContext: RenderContext = {
    ...context,
    namespace: type === "foreignObject" ? XHTML_NAMESPACE : elementNamespace,
  };

  if (children !== null && children !== undefined) {
    element.append(...render(children, childrenContext));
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

function renderElement(node: JSX.Element, context: RenderContext) {
  const { type, properties } = node;

  if (typeof type === "string") {
    return renderDOMElement(node, context);
  }

  if (isClassComponent(type)) {
    const instance = new type({ ...properties, signal: context.signal });
    return render(instance.render(), context);
  }

  return render(type({ ...properties, signal: context.signal }), context);
}

function renderFragment(nodes: JSX.Node[], context: RenderContext) {
  const renderedNodes: Node[] = [];
  for (const node of nodes) {
    renderedNodes.push(...render(node, context));
  }
  return renderedNodes;
}

function renderReactiveNode(
  store: Reactive<JSX.Node>,
  context: RenderContext,
) {
  const abort = new AbortController();
  const childContext = combineSignal(context, abort.signal);

  const nodes = render(store.value, childContext);

  if (nodes.length === 0) {
    nodes.push(createPlaceholderNode());
  }

  const range: MutableRange = {
    store,
    anchor: nodes[0]!,
    length: nodes.length,
    abort,
  };
  store.subscribe(() => updateRange(range, context), context.signal);
  return nodes;
}

export function render(
  node: JSX.Node,
  context: RenderContext = {},
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
    return renderElement(node, context);
  }

  if (Array.isArray(node)) {
    return renderFragment(node, context);
  }

  if (isReactive(node)) {
    return renderReactiveNode(node, context);
  }

  throw new Error("Invalid node");
}

export function hydrate(
  node: JSX.Node,
  container: Element,
  context: RenderContext = {},
) {
  hydrateNode(node, container, 0, context);
}
