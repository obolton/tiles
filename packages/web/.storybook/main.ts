import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/__tests__/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  addons: ["@storybook/addon-essentials"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  env: (config) => ({
    ...config,
    PUBLIC_API_BASE_URL: "https://localhost",
  }),
  viteFinal: (config) => ({
    ...config,
    envPrefix: "PUBLIC_",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src"),
      },
    },
  }),
};

export default config;
