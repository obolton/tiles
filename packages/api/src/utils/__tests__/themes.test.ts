import { describe, expect, test } from "vitest";
import { FONT_IDS } from "fonts/config";
import { getBackgroundProperties, getDefaultThemesData } from "../themes";

describe("getBackgroundProperties", () => {
  test("returns undefined if the input is undefined", () => {
    expect(getBackgroundProperties(undefined)).toBeUndefined();
  });

  test("returns a null background", () => {
    expect(getBackgroundProperties(null)).toEqual({
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: null,
    });
  });

  test("returns a color background", () => {
    expect(
      getBackgroundProperties({
        type: "color",
        color: "ff00ff00ff00",
      }),
    ).toEqual({
      backgroundColor: new Uint8Array([255, 0, 255, 0, 255, 0]),
      backgroundGradient: null,
    });
  });

  test("returns a gradient background", () => {
    expect(
      getBackgroundProperties({
        type: "gradient",
        colorA: "ff00ff00ff00",
        colorB: "00ff0000ff00",
        direction: "VERTICAL",
      }),
    ).toEqual({
      backgroundColor: new Uint8Array([255, 0, 255, 0, 255, 0, 0, 255, 0, 0, 255, 0]),
      backgroundGradient: "VERTICAL",
    });
  });

  test("returns an image background", () => {
    expect(
      getBackgroundProperties({
        type: "image",
        imageId: "test",
      }),
    ).toEqual({
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: "test",
    });
  });
});

describe("getDefaultThemesData", () => {
  const themes = getDefaultThemesData();

  test("returns themes with unique names", () => {
    const names = themes.map((theme) => theme.name);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });

  test("decodes solid colors into bytes", () => {
    expect(themes.find((theme) => theme.name === "Light")).toEqual({
      name: "Light",
      backgroundColor: new Uint8Array([255, 255, 255, 255, 255, 255]),
      backgroundGradient: null,
      textColor: new Uint8Array([26, 26, 26, 26, 26, 26]),
      accentColor: new Uint8Array([0, 0, 102, 102, 255, 255]),
      headingFont: "inter",
      bodyFont: "inter",
      codeFont: "jetbrains-mono",
    });
  });

  test("decodes gradient backgrounds into two colors", () => {
    expect(themes.find((theme) => theme.name === "Ocean")).toMatchObject({
      backgroundGradient: "VERTICAL",
      backgroundColor: new Uint8Array([8, 8, 16, 16, 48, 48, 24, 24, 96, 96, 144, 144]),
    });
  });

  test.each(themes)("$name has valid colors", (theme) => {
    expect(theme.backgroundColor).toHaveLength(theme.backgroundGradient ? 12 : 6);
    expect(theme.textColor).toHaveLength(6);
    expect(theme.accentColor).toHaveLength(6);
  });

  test.each(themes)("$name repeats each color channel byte", (theme) => {
    for (const color of [theme.backgroundColor, theme.textColor, theme.accentColor]) {
      const high = color.filter((_, index) => index % 2 === 0);
      const low = color.filter((_, index) => index % 2 === 1);
      expect(low).toEqual(high);
    }
  });

  test.each(themes)("$name uses registered fonts", (theme) => {
    expect(FONT_IDS).toContain(theme.headingFont);
    expect(FONT_IDS).toContain(theme.bodyFont);
    expect(FONT_IDS).toContain(theme.codeFont);
  });

  test.each(themes)("$name fits the theme name length limit", (theme) => {
    expect(theme.name.length).toBeLessThanOrEqual(50);
  });
});
