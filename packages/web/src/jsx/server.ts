import { escapeUTF8 } from "entities";
import { isReactive } from "@/utils/reactivity";
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

// https://developer.mozilla.org/en-US/docs/Glossary/Void_element
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

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
  const attributes = getDOMAttributes(properties).join(" ");
  const children = properties.children;

  if (VOID_ELEMENTS.has(tagName)) {
    return "<" + tagName + (attributes ? " " + attributes : "") + ">";
  } else {
    return (
      "<" +
      tagName +
      (attributes ? " " + attributes : "") +
      ">" +
      renderToString(children) +
      "</" +
      tagName +
      ">"
    );
  }
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

function getDOMAttributes(properties: Record<string, unknown>) {
  const attributes: string[] = [];
  for (const [name, valueOrStore] of Object.entries(properties)) {
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

    const attributeName = mapAttributeName(name);
    if (attributeName === "classlist" && typeof value === "object") {
      const classNames = serializeClassList(value as ClassList);
      if (classNames) {
        attributes.push('class="' + escapeUTF8(classNames) + '"');
      }
    } else if (attributeName === "style" && typeof value === "object") {
      attributes.push(
        attributeName + '="' + escapeUTF8(serializeStyles(value)) + '"',
      );
    } else if (BOOLEAN_STRING_ATTRIBUTES.has(attributeName)) {
      attributes.push(
        attributeName +
          "=" +
          (value && value !== "false" ? '"true"' : '"false"'),
      );
    } else if (typeof value === "boolean") {
      if (value) {
        attributes.push(attributeName);
      }
    } else if (typeof value === "number" || typeof value === "bigint") {
      attributes.push(attributeName + '="' + value + '"');
    } else {
      attributes.push(
        attributeName + '="' + escapeUTF8(value.toString()) + '"',
      );
    }
  }
  return attributes;
}
