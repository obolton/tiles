import { escapeUTF8 } from "entities";
import type { JSX } from "./jsx";

export function renderToString(node: JSX.Node): string {
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

function renderHTMLElement<P extends JSX.Properties>(
  tagName: string,
  properties: P,
) {
  const attributes = getDOMAttributes(properties).join(" ");
  const children = properties.children;

  if (children === null || typeof children === "undefined") {
    return "<" + tagName + (attributes ? " " + attributes : "") + " />";
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

function renderElement<P>({ type, properties }: JSX.Element<P>) {
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
  const attributes = [];
  for (const [name, value] of Object.entries(properties)) {
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
    if (value === true) {
      attributes.push(attributeName);
    } else if (typeof value === "number" || typeof value === "bigint") {
      attributes.push(`${attributeName}="${value}"`);
    } else {
      attributes.push(`${attributeName}="${escapeUTF8(value.toString())}"`);
    }
  }
  return attributes;
}
