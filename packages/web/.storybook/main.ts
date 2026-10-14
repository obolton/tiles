import type { StorybookConfig } from "@storybook/html-vite";

export default {
  stories: ["../src/**/__tests__/*.stories.@(ts|tsx)"],
  framework: "@storybook/html-vite",
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  env: {
    PUBLIC_FONTS_BASE_URL: "http://localhost",
    PUBLIC_IMAGES_BASE_URL: "http://localhost",
  },
} satisfies StorybookConfig;
