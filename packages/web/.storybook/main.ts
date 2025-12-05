import type { StorybookConfig } from "@storybook/html-vite";

export default {
  stories: ["../src/**/__tests__/*.stories.@(ts|tsx)"],
  framework: "@storybook/html-vite",
  addons: ["@storybook/addon-a11y"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  env: (config) => ({
    ...config,
    PUBLIC_API_BASE_URL: "https://localhost",
  }),
} satisfies StorybookConfig;
