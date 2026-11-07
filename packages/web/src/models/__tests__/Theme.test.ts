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

  test("exposes the theme data reactively", () => {
    const theme = new Theme(THEME);

    expect(theme.id).toBe(THEME.id);
    expect(theme.workspaceId).toBe(THEME.workspaceId);
    expect(theme.data.value).toEqual(THEME);
  });

  describe("update", () => {
    test("applies the change and persists it", async () => {
      const theme = new Theme(THEME);

      await theme.update({ name: "Renamed", colors: { text: "ff0000000000" } });

      expect(theme.data.value.name).toBe("Renamed");
      expect(theme.data.value.colors).toEqual({
        text: "ff0000000000",
        accent: THEME.colors.accent,
      });
      expect(updateMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        id: THEME.id,
        name: "Renamed",
        colors: { text: "ff0000000000" },
      });
    });

    test("merges partial fonts", async () => {
      const theme = new Theme(THEME);

      await theme.update({ fonts: { heading: "quicksand" } });

      expect(theme.data.value.fonts).toEqual({ ...THEME.fonts, heading: "quicksand" });
    });

    test("replaces the background", async () => {
      const theme = new Theme(THEME);
      const background = {
        type: "gradient" as const,
        colorA: "ff0000000000",
        colorB: "0000ffffffff",
        direction: "VERTICAL" as const,
      };

      await theme.update({ background });

      expect(theme.data.value.background).toEqual(background);
    });

    test("notifies subscribers before persisting", () => {
      const theme = new Theme(THEME);
      const listener = vi.fn();
      theme.data.subscribe(listener);

      void theme.update({ name: "Renamed" });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test("reverts the change when persisting fails", async () => {
      const theme = new Theme(THEME);
      updateMock.mockRejectedValueOnce(new Error("Offline"));

      await expect(theme.update({ name: "Renamed" })).rejects.toThrow("Offline");

      expect(theme.data.value.name).toBe(THEME.name);
    });
  });

  describe("serialize", () => {
    test("returns the theme data", () => {
      const theme = new Theme(THEME);

      expect(theme.serialize()).toEqual(THEME);
    });
  });

  describe("duplicate", () => {
    test("creates a copy with a ' Copy' suffix", async () => {
      const theme = new Theme(THEME);

      await theme.duplicate();

      expect(createMock).toHaveBeenCalledWith({
        workspaceId: THEME.workspaceId,
        name: `${THEME.name} Copy`,
        background: THEME.background,
        colors: THEME.colors,
        fonts: THEME.fonts,
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
