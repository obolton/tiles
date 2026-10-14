import { vi } from "vitest";
import { listThemes, createTheme, updateTheme, deleteTheme } from "@/routes/themes/themes";
import { describeRouter } from "@/test/procedures";
import { WORKSPACE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/themes/themes");

const THEME_ID = "55555555-5555-4555-8555-555555555555";

const THEME = {
  name: "Theme",
  colors: { text: "000000000000", accent: "ffffffffffff" },
  fonts: { heading: "inter", body: "inter", code: "jetbrains-mono" },
};

describeRouter("themes", {
  list: {
    guard: "workspace",
    handler: listThemes,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: "not-a-uuid" },
  },
  create: {
    guard: "workspace",
    handler: createTheme,
    input: { workspaceId: WORKSPACE_ID, ...THEME },
    invalid: { workspaceId: WORKSPACE_ID, ...THEME, name: "" },
  },
  update: {
    guard: "workspace",
    handler: updateTheme,
    input: { workspaceId: WORKSPACE_ID, id: THEME_ID, name: "Renamed" },
    invalid: { workspaceId: WORKSPACE_ID, id: THEME_ID, name: "" },
  },
  delete: {
    guard: "workspace",
    handler: deleteTheme,
    input: { workspaceId: WORKSPACE_ID, id: THEME_ID },
    invalid: { workspaceId: WORKSPACE_ID, id: "not-a-uuid" },
  },
});
