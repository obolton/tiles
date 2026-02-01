import { render } from "./dom";
import type { JSX } from "./jsx";

export interface PortalProps {
  children: JSX.Node;
  element?: Element;
  signal?: AbortSignal;
}

export default function Portal({ children, element, signal }: PortalProps) {
  if (import.meta.env.SSR) {
    return null;
  }

  const nodes = render(children, null, signal);
  const parent = element ?? document.body;
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
