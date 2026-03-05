import { afterEach, describe, expect, test, vi } from "vitest";
import Theme from "@/models/Theme";
import client from "@/api/client";
import { THEME } from "@/test/fixtures/Theme";

vi.mock("@/api/client", () => ({
  default: {
    themes: {
      update: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Theme", () => {
  const updateMock = vi.mocked(client.themes.update.mutate);
  const deleteMock = vi.mocked(client.themes.delete.mutate);

  afterEach(() => {
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  test("maps properties to reactive values", () => {
    const theme = new Theme(THEME);

    expect(theme.id).toBe(THEME.id);
    expect(theme.workspaceId).toBe(THEME.workspaceId);
    expect(theme.name.value).toBe(THEME.name);
    expect(theme.colors.value).toEqual(THEME.colors);
    expect(theme.fonts.value).toEqual(THEME.fonts);
  });

  describe("setName", () => {
    test("updates name and persists the change", async () => {
      const theme = new Theme(THEME);
      const name = "New Theme Name";

      await theme.setName(name);

      expect(theme.name.value).toBe(name);
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        name,
      });
    });
  });

  describe("setColors", () => {
    test("updates colors and persists the change", async () => {
      const theme = new Theme(THEME);
      const colors = { text: "ff0000000000" as const };

      await theme.setColors(colors);

      expect(theme.colors.value.text).toBe("ff0000000000");
      expect(theme.colors.value.accent).toBe(THEME.colors.accent);
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        colors,
      });
    });
  });

  describe("setFonts", () => {
    test("updates fonts and persists the change", async () => {
      const theme = new Theme(THEME);
      const fonts = { heading: "CLASSIC" as const };

      await theme.setFonts(fonts);

      expect(theme.fonts.value.heading).toBe("CLASSIC");
      expect(theme.fonts.value.body).toBe(THEME.fonts.body);
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        fonts,
      });
    });
  });

  describe("delete", () => {
    test("deletes the theme", async () => {
      const theme = new Theme(THEME);

      await theme.delete();

      expect(deleteMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
      });
    });
  });
});
