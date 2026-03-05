import { afterEach, describe, expect, test, vi } from "vitest";
import Theme from "@/models/Theme";
import client from "@/api/client";
import { THEME } from "@/test/fixtures/Theme";

vi.mock("@/api/client", () => ({
  default: {
    themes: {
      create: {
        mutate: vi.fn(),
      },
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
  const createMock = vi.mocked(client.themes.create.mutate);
  const updateMock = vi.mocked(client.themes.update.mutate);
  const deleteMock = vi.mocked(client.themes.delete.mutate);

  afterEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  test("maps properties to reactive values", () => {
    const theme = new Theme(THEME);

    expect(theme.id).toBe(THEME.id);
    expect(theme.workspaceId).toBe(THEME.workspaceId);
    expect(theme.name.value).toBe(THEME.name);
    expect(theme.background.value).toEqual(THEME.background);
    expect(theme.colors.value).toEqual(THEME.colors);
    expect(theme.fonts.value).toEqual(THEME.fonts);
    expect(theme.border.value).toBe(THEME.border);
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

  describe("setBackground", () => {
    test("updates background and persists the change", async () => {
      const theme = new Theme(THEME);
      const background = {
        type: "gradient" as const,
        colorA: "ff0000000000",
        colorB: "0000ffffffff",
        direction: "VERTICAL" as const,
      };

      await theme.setBackground(background);

      expect(theme.background.value).toEqual(background);
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        background,
      });
    });
  });

  describe("setBorder", () => {
    test("updates border color and persists the change", async () => {
      const theme = new Theme(THEME);

      await theme.setBorder("ff00ff00ff00");

      expect(theme.border.value).toBe("ff00ff00ff00");
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        border: "ff00ff00ff00",
      });
    });

    test("clears border when set to null", async () => {
      const themeWithBorder = { ...THEME, border: "ff00ff00ff00" };
      const theme = new Theme(themeWithBorder);

      await theme.setBorder(null);

      expect(theme.border.value).toBeNull();
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        border: null,
      });
    });
  });

  describe("serialize", () => {
    test("returns a plain data object matching the input", () => {
      const theme = new Theme(THEME);
      expect(theme.serialize()).toEqual(THEME);
    });

    test("reflects mutated values", () => {
      const theme = new Theme(THEME);
      theme.name.value = "Changed";
      theme.colors.value = { text: "aaaaaaaaaaaa", accent: "bbbbbbbbbbbb" };

      const data = theme.serialize();
      expect(data.name).toBe("Changed");
      expect(data.colors).toEqual({
        text: "aaaaaaaaaaaa",
        accent: "bbbbbbbbbbbb",
      });
    });
  });

  describe("duplicate", () => {
    test("creates a copy with ' Copy' suffix", async () => {
      const theme = new Theme(THEME);

      await theme.duplicate();

      expect(createMock).toHaveBeenCalledWith({
        id: THEME.id,
        workspaceId: THEME.workspaceId,
        name: `${THEME.name} Copy`,
        background: THEME.background,
        colors: THEME.colors,
        fonts: THEME.fonts,
        border: THEME.border,
      });
    });

    test("omits background when null", async () => {
      const themeData = { ...THEME, background: null };
      const theme = new Theme(themeData);

      await theme.duplicate();

      const call = createMock.mock.calls[0]![0];
      expect(call.background).toBeUndefined();
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
