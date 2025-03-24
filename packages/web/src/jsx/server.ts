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

function renderElement(element: JSX.Element) {
  const { type, children } = element;
  const attributes = getDOMAttributes(element).join(" ");

  if (typeof children === "undefined" || children === null) {
    return "<" + type + (attributes ? " " + attributes : "") + " />";
  } else {
    return (
      "<" +
      type +
      (attributes ? " " + attributes : "") +
      ">" +
      renderToString(children) +
      "</" +
      type +
      ">"
    );
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

function getDOMAttributes(element: JSX.Element) {
  const attributes = [];
  for (const [name, value] of Object.entries(element.properties)) {
    if (
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
