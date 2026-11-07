import type { Theme } from "api/types/themes";

export const THEME: Theme = {
  id: "theme-id",
  workspaceId: "workspace-id",
  name: "Test Theme",
  background: { type: "color", color: "ffffffffffff" },
  colors: {
    text: "000000000000",
    accent: "0000ffffffff",
  },
  fonts: {
    heading: "lora",
    body: "inter",
    code: "jetbrains-mono",
  },
};

export const DARK_THEME: Theme = {
  id: "dark-theme-id",
  workspaceId: "workspace-id",
  name: "Dark Theme",
  background: { type: "color", color: "000000000000" },
  colors: {
    text: "ffffffffffff",
    accent: "ffff00000000",
  },
  fonts: {
    heading: "inter",
    body: "inter",
    code: "jetbrains-mono",
  },
};
