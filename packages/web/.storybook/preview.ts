import "@/styles/global.css";
import "@/styles/animation.css";
import "@/styles/tabs.css";
import "@/styles/popovers.css";
import "@/styles/toasts.css";
import type { Preview } from "@storybook/react";

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
