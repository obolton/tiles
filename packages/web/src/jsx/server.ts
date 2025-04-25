import { escapeUTF8 } from "entities";
import { BaseStore } from "@/utils/stores";
import { serializeStyles } from "@/utils/css";
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
  if (node instanceof BaseStore) {
    return renderToString(node.value);
  }

  if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  ) {
    return node.toString();
  }

  if (
    typeof node === "boolean" ||
    typeof node === "undefined" ||
    node === null
  ) {
    return "";
  }

  if (Array.isArray(node)) {
    return renderFragment(node);
  }

  if ("type" in node) {
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
  } else {
    return renderToString(type(properties));
  }
}

function mapAttributeName(name: string) {
  switch (name) {
    case "className":
      return "class";
    default:
      return name.toLowerCase();
  }
}

function getDOMAttributes(properties: Record<string, unknown>) {
  const attributes: string[] = [];
  for (const [name, valueOrStore] of Object.entries(properties)) {
    const value =
      valueOrStore instanceof BaseStore ? valueOrStore.value : valueOrStore;
    if (
      name === "children" ||
      typeof value === "function" ||
      typeof value === "undefined" ||
      value === false ||
      value === null
    ) {
      continue;
    }
    const attributeName = mapAttributeName(name);
    if (attributeName === "style" && typeof value === "object") {
      attributes.push(
        attributeName + '="' + escapeUTF8(serializeStyles(value)) + '"',
      );
    } else if (value === true) {
      attributes.push(attributeName);
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
