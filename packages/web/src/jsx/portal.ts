import { render } from "./dom";
import type { JSX } from "./jsx";

export interface PortalProps {
  children: JSX.Node;
  element?: Element | string;
  signal?: AbortSignal;
}

function resolveElement(element?: Element | string): Element {
  if (typeof element === "string") {
    const resolved = document.getElementById(element);
    if (!resolved) {
      throw new Error(`Element with ID "${element}" not found`);
    }
    return resolved;
  }
  return element ?? document.body;
}

export default function Portal({ children, element, signal }: PortalProps) {
  if (import.meta.env.SSR) {
    return null;
  }

  const nodes = render(children, null, signal);
  const parent = resolveElement(element);
  parent.append(...nodes);

  signal?.addEventListener(
    "abort",
    () => {
      for (const node of nodes) {
        parent.removeChild(node);
      }
    },
    { once: true },
  );

  return null;
}
