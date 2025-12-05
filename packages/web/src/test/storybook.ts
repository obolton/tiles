import { render } from "@/jsx/dom";
import type { JSX } from "@/jsx/jsx";

export function renderStory(node: JSX.Node): Element | DocumentFragment {
  const nodes = render(node);

  if (nodes.length === 1 && nodes[0] instanceof Element) {
    return nodes[0];
  }

  const fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
}
