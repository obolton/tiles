import { escapeText } from "entities";
import { unwrap } from "@/utils/reactivity";
import { openTag, closeTag, VOID_ELEMENTS, type Attributes } from "@/utils/html";
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

type Item = string | { node: JSX.Node };

export function renderToString(node: JSX.Node): string {
  let output = "";
  const stack: Item[] = [{ node }];

  while (stack.length > 0) {
    output += renderItem(stack.pop()!, stack);
  }

  return output;
}

function renderItem(item: Item, stack: Item[]): string {
  if (typeof item === "string") {
    return item;
  }

  const node = unwrap(item.node);

  if (isEmptyNode(node)) {
    return "";
  }

  if (isTextNode(node)) {
    return escapeText(node.toString());
  }

  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      stack.push({ node: node[i] });
    }
    return "";
  }

  if (isElementNode(node)) {
    const { type, properties } = node;

    if (typeof type === "string") {
      const open = openTag(type, getAttributes(properties));

      if (VOID_ELEMENTS.has(type)) {
        return open;
      } else {
        stack.push(closeTag(type));
        stack.push({ node: properties.children });
        return open;
      }
    }

    if (isClassComponent(type)) {
      const instance = new type(properties);
      stack.push({ node: instance.render() });
      return "";
    }

    stack.push({ node: type(properties) });
    return "";
  }

  throw new Error(`Invalid node: ${node}`);
}

function getAttributes(properties: Record<string, unknown>): Attributes {
  const attributes: Attributes = {};
  for (const [originalName, valueOrReactive] of Object.entries(properties)) {
    const name = mapAttributeName(originalName);
    const value = unwrap(valueOrReactive);

    if (
      name === "children" ||
      name.startsWith("$") ||
      name.startsWith("bind:") ||
      name.startsWith("on:") ||
      typeof value === "function" ||
      value === undefined ||
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
      attributes[name] = typeof value === "string" ? value : value ? "true" : "false";
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
