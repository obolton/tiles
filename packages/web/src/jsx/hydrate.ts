import type { JSX } from "./jsx";

function isElementNode(node: JSX.Node): node is JSX.Element {
  return typeof node === "object" && node !== null && "type" in node;
}

function hydrateElement<T extends JSX.ElementType>(
  { type, properties }: JSX.Element<T>,
  domElement: Element,
) {
  if (typeof type === "string") {
    hydrateDOMElement(type, properties, domElement);
  } else {
    hydrate(type(properties), domElement);
  }
}

function hydrateDOMElement<T extends keyof JSX.IntrinsicElements>(
  tagName: T,
  properties: JSX.Properties<T>,
  domElement: Element,
) {
  if (domElement.tagName.toLowerCase() !== tagName) {
    throw new Error(
      `Hydration error: unexpected element "${domElement.tagName.toLowerCase()}", expected "${tagName}"`,
    );
  }

  for (const [name, value] of Object.entries(properties)) {
    if (name.startsWith("on") && typeof value === "function") {
      domElement.addEventListener(
        name.slice(2).toLowerCase(),
        value as EventListener,
      );
    }
  }

  hydrateFragment(toNodeArray(properties.children), domElement);
}

function toNodeArray(node: JSX.Node) {
  if (!node) {
    return [];
  } else if (Array.isArray(node)) {
    return node;
  } else {
    return [node];
  }
}

function hydrateFragment(fragment: JSX.Node[], domElement: Element) {
  const elements = fragment.filter(isElementNode);

  if (elements.length !== domElement.childElementCount) {
    throw new Error("Hydration error: element count mismatch");
  }

  for (let i = 0; i < elements.length; i++) {
    hydrate(elements[i]!, domElement.children[i]!);
  }
}

export function hydrate(node: JSX.Node, domElement: Element) {
  if (isElementNode(node)) {
    hydrateElement(node, domElement);
  } else if (Array.isArray(node)) {
    hydrateFragment(node, domElement);
  }
}
