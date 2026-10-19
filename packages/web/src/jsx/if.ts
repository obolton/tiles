import type { Reactive } from "reactivity";
import type { JSX } from "@/jsx/jsx";

export interface IfProps {
  condition: Reactive<unknown>;
  children: JSX.Node;
}

export default function If({ condition, children }: IfProps) {
  return condition.derive((value) => (value ? children : null));
}
