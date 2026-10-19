import "@/styles";
import "@/elements/global";
import "@/elements/editor";
import { render } from "jsx/dom";
import type { JSX } from "jsx/jsx";
import type { Preview } from "@storybook/html-vite";

function renderStory(node: JSX.Node) {
  const nodes = render(node);

  if (nodes.length === 1 && nodes[0] instanceof Element) {
    return nodes[0];
  }

  const fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
}

export default {
  decorators: [(Story) => renderStory(Story())],
  parameters: {
    a11y: {
      test: "error",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
} satisfies Preview;
