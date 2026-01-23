import type { StorybookConfig } from "@storybook/html-vite";

export default {
  stories: ["../src/**/__tests__/*.stories.@(ts|tsx)"],
  framework: "@storybook/html-vite",
  addons: ["@storybook/addon-a11y"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
} satisfies StorybookConfig;
