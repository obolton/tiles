import { isReactive } from "@/utils/reactivity";
import { tag, type Attributes } from "@/utils/html";
import { isClassComponent } from "./jsx";
import { isEmptyNode, isTextNode, isElementNode } from "./node-types";
import {
  BOOLEAN_STRING_ATTRIBUTES,
  serializeClassList,
  serializeStyles,
  mapAttributeName,
} from "./attributes";
import type { ClassList } from "./html-attributes";
import type { JSX } from "./jsx";

export function renderToString(node: JSX.Node): string {
  if (isReactive(node)) {
    return renderToString(node.value);
  }

  if (isTextNode(node)) {
    return node.toString();
  }

  if (isEmptyNode(node)) {
    return "";
  }

  if (Array.isArray(node)) {
    return renderFragment(node);
  }

  if (isElementNode(node)) {
    return renderElement(node);
  }

  throw new Error(`Invalid node: ${node}`);
}

function renderFragment(nodes: JSX.Node[]) {
  return nodes.map(renderToString).join("");
}

function renderHTMLElement<T extends keyof JSX.IntrinsicElements>(
  tagName: T,
  properties: JSX.Properties<T>,
) {
  return tag(
    tagName,
    getAttributes(properties),
    renderToString(properties.children),
  );
}

function renderElement<T extends JSX.ElementType>({
  type,
  properties,
}: JSX.Element<T>) {
  if (typeof type === "string") {
    return renderHTMLElement(type, properties);
  } else if (isClassComponent(type)) {
    const instance = new type(properties);
    return renderToString(instance.render());
  } else {
    return renderToString(type(properties));
  }
}

function getAttributes(properties: Record<string, unknown>): Attributes {
  const attributes: Attributes = {};
  for (const [originalName, valueOrStore] of Object.entries(properties)) {
    const name = mapAttributeName(originalName);
    const value = isReactive(valueOrStore) ? valueOrStore.value : valueOrStore;

    if (
      name === "children" ||
      name.startsWith("$") ||
      name.startsWith("on:") ||
      typeof value === "function" ||
      typeof value === "undefined" ||
      value === null
    ) {
      continue;
    }

    if (name === "classList" && typeof value === "object") {
      const classNames = serializeClassList(value as ClassList);
      if (classNames) {
        attributes["class"] = classNames;
      }
    } else if (name === "style" && typeof value === "object") {
      const styles = serializeStyles(value);
      if (styles) {
        attributes["style"] = styles;
      }
    } else if (BOOLEAN_STRING_ATTRIBUTES.has(name)) {
      attributes[name] =
        typeof value === "string" ? value : value ? "true" : "false";
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint" ||
      typeof value === "boolean"
    ) {
      attributes[name] = value;
    } else {
      attributes[name] = value.toString();
    }
  }

  return attributes;
}
