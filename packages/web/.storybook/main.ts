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
    PUBLIC_API_ORIGIN: "https://api.test",
    PUBLIC_UPLOAD_ORIGIN: "https://uploads.test",
    PUBLIC_COLLABORATION_URL: "wss://api.test/collaboration",
    PUBLIC_FONTS_BASE_URL: "http://localhost",
    PUBLIC_IMAGES_BASE_URL: "http://localhost",
    PUBLIC_PROFILE_IMAGES_BASE_URL: "https://profile-images.test",
    PUBLIC_SESSION_COOKIE_DOMAIN: ".test",
    PUBLIC_PAGE_ID: "home-page",
  },
} satisfies StorybookConfig;
