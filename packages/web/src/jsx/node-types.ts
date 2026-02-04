import type { JSX } from "./jsx";

export function isEmptyNode(
  node: JSX.Node,
): node is boolean | null | undefined {
  return typeof node === "boolean" || node === undefined || node === null;
}

export function isTextNode(node: JSX.Node): node is string | number | bigint {
  return (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  );
}

export function isElementNode(node: JSX.Node): node is JSX.Element {
  return typeof node === "object" && node !== null && "type" in node;
}
