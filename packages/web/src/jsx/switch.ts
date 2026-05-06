import { isElementNode, toNodeArray } from "./node-types";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "./jsx";

export interface SwitchProps<T> {
  value: Reactive<T>;
  children: JSX.Node;
}

export interface CaseProps<T> {
  value: T;
  children: JSX.Node;
}

export interface DefaultProps {
  children: JSX.Node;
}

function isCaseElement<T>(
  node: JSX.Node,
): node is JSX.Element<JSX.Component<CaseProps<T>>> {
  return isElementNode(node) && node.type === Case;
}

function isDefaultElement(
  node: JSX.Node,
): node is JSX.Element<JSX.Component<DefaultProps>> {
  return isElementNode(node) && node.type === Default;
}

export function Switch<T>({ value, children }: SwitchProps<T>) {
  const branches = toNodeArray(children);

  return value.derive((current) => {
    let fallback: JSX.Node = null;

    for (const branch of branches) {
      if (isCaseElement<T>(branch) && branch.properties.value === current) {
        return branch.properties.children;
      }

      if (fallback === null && isDefaultElement(branch)) {
        fallback = branch.properties.children;
      }
    }

    return fallback;
  });
}

export function Case<T>(_props: CaseProps<T>): JSX.Node {
  throw new Error("<Case> must be a direct child of <Switch>");
}

export function Default(_props: DefaultProps): JSX.Node {
  throw new Error("<Default> must be a direct child of <Switch>");
}
