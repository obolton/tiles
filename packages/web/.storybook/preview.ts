import "@/styles/global.css";
import "@/styles/animation.css";
import "@/styles/tabs.css";
import type { Preview } from "@storybook/react";
import "@/components/webComponents";

const preview = {
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
