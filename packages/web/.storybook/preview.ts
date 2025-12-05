import "@/styles";
import { renderStory } from "../src/test/storybook";
import type { Preview } from "@storybook/html-vite";

const preview = {
  decorators: [(Story) => renderStory(Story())],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
} satisfies Preview;

export default preview;
