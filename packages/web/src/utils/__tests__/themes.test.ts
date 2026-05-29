import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import {
  resolveThemeStyles,
  toCSSProperties,
  getThemeColors,
  getThemeStyles,
  getPageBodyStyle,
} from "../themes";
import { THEME } from "@/test/fixtures/Theme";
import type { Theme } from "api/types/themes";

describe("resolveThemeStyles", () => {
  describe("with theme and no overrides", () => {
    test("returns theme background as ColorFill", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.background).toEqual({
        type: "color",
        color: "ffffffffffff",
      });
    });

    test("returns theme text color", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.textColor).toBe("000000000000");
    });

    test("returns theme accent color", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.accentColor).toBe("0000ffffffff");
    });

    test("returns theme body font as CSS font-family string", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.font).toBe('"Inter", sans-serif');
    });

    test("returns theme heading font as CSS font-family string", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.headingFont).toBe('"Lora", serif');
    });

    test("returns theme code font as CSS font-family string", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.codeFont).toBe('"JetBrains Mono", monospace');
    });
  });

  describe("with overrides", () => {
    test("override takes precedence over theme background", () => {
      const result = resolveThemeStyles(THEME, {
        background: { type: "color", color: "ff0000000000" },
      });
      expect(result.background).toEqual({
        type: "color",
        color: "ff0000000000",
      });
    });

    test("override takes precedence over theme text color", () => {
      const result = resolveThemeStyles(THEME, {
        textColor: "00ff00000000",
      });
      expect(result.textColor).toBe("00ff00000000");
    });

    test("override takes precedence over theme accent color", () => {
      const result = resolveThemeStyles(THEME, {
        accentColor: "0000ff000000",
      });
      expect(result.accentColor).toBe("0000ff000000");
    });

    test("override takes precedence over theme font", () => {
      const result = resolveThemeStyles(THEME, {
        font: "lora",
      });
      expect(result.font).toBe('"Lora", serif');
    });

    test("null override uses theme value", () => {
      const result = resolveThemeStyles(THEME, {
        background: null,
      });
      expect(result.background).toEqual({
        type: "color",
        color: "ffffffffffff",
      });
    });
  });

  describe("border resolution", () => {
    test("falls back to text color when border is null", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.borderColor).toBe(THEME.colors.text);
    });

    test("uses explicit border color when set", () => {
      const theme: Theme = { ...THEME, border: "ff00ff00ff00" };
      const result = resolveThemeStyles(theme, {});
      expect(result.borderColor).toBe("ff00ff00ff00");
    });
  });

  describe("background variants", () => {
    test("returns null when theme has no background", () => {
      const theme: Theme = { ...THEME, background: null };
      const result = resolveThemeStyles(theme, {});
      expect(result.background).toBeNull();
    });

    test("passes through gradient background", () => {
      const gradient = {
        type: "gradient" as const,
        colorA: "ff0000000000",
        colorB: "0000ffffffff",
        direction: "VERTICAL" as const,
      };
      const theme: Theme = { ...THEME, background: gradient };
      const result = resolveThemeStyles(theme, {});
      expect(result.background).toEqual(gradient);
    });
  });

  describe("with null theme", () => {
    test("returns override values when theme is null", () => {
      const result = resolveThemeStyles(null, {
        background: { type: "color", color: "ff0000000000" },
        textColor: "00ff00000000",
        accentColor: "0000ff000000",
        font: "jetbrains-mono",
      });
      expect(result.background).toEqual({
        type: "color",
        color: "ff0000000000",
      });
      expect(result.textColor).toBe("00ff00000000");
      expect(result.accentColor).toBe("0000ff000000");
      expect(result.font).toBe('"JetBrains Mono", monospace');
    });

    test("returns null for all properties when no overrides", () => {
      const result = resolveThemeStyles(null, {});
      expect(result.background).toBeNull();
      expect(result.textColor).toBeNull();
      expect(result.accentColor).toBeNull();
      expect(result.font).toBeNull();
      expect(result.headingFont).toBeNull();
      expect(result.codeFont).toBeNull();
    });
  });
});

describe("toCSSProperties", () => {
  test("converts background fill to CSS custom property", () => {
    const result = toCSSProperties({
      background: { type: "color", color: "ffff80008000" },
      textColor: null,
      accentColor: null,
      font: null,
      headingFont: null,
      codeFont: null,
      borderColor: null,
    });
    expect(result["--background"]).toBe(
      "color(display-p3 1.0000 0.5000 0.5000)",
    );
  });

  test("converts text color to CSS custom property", () => {
    const result = toCSSProperties({
      background: null,
      textColor: "000000000000",
      accentColor: null,
      font: null,
      headingFont: null,
      codeFont: null,
      borderColor: null,
    });
    expect(result["--text-color"]).toBe(
      "color(display-p3 0.0000 0.0000 0.0000)",
    );
  });

  test("converts accent color to CSS custom property", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: "0000ffffffff",
      font: null,
      headingFont: null,
      codeFont: null,
      borderColor: null,
    });
    expect(result["--accent-color"]).toBe(
      "color(display-p3 0.0000 1.0000 1.0000)",
    );
  });

  test("includes font as CSS custom property", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: null,
      font: '"Inter", sans-serif',
      headingFont: null,
      codeFont: null,
      borderColor: null,
    });
    expect(result["--font"]).toBe('"Inter", sans-serif');
  });

  test("includes heading font as CSS custom property", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: null,
      font: null,
      headingFont: '"Lora", serif',
      codeFont: null,
      borderColor: null,
    });
    expect(result["--heading-font"]).toBe('"Lora", serif');
  });

  test("includes code font as CSS custom property", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: null,
      font: null,
      headingFont: null,
      codeFont: '"JetBrains Mono", monospace',
      borderColor: null,
    });
    expect(result["--code-font"]).toBe('"JetBrains Mono", monospace');
  });

  test("converts border color to CSS custom property", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: null,
      font: null,
      headingFont: null,
      codeFont: null,
      borderColor: "ffff00000000",
    });
    expect(result["--border-color"]).toBe(
      "color(display-p3 1.0000 0.0000 0.0000)",
    );
  });

  test("omits properties with null values", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: null,
      font: null,
      headingFont: null,
      codeFont: null,
      borderColor: null,
    });
    expect(result["--background"]).toBeUndefined();
    expect(result["--text-color"]).toBeUndefined();
    expect(result["--accent-color"]).toBeUndefined();
    expect(result["--font"]).toBeUndefined();
    expect(result["--heading-font"]).toBeUndefined();
    expect(result["--code-font"]).toBeUndefined();
    expect(result["--border-color"]).toBeUndefined();
  });

  test("includes all properties when all values are set", () => {
    const result = toCSSProperties({
      background: { type: "color", color: "ffffffffffff" },
      textColor: "000000000000",
      accentColor: "0000ffffffff",
      font: '"Inter", sans-serif',
      headingFont: '"Lora", serif',
      codeFont: '"JetBrains Mono", monospace',
      borderColor: "000000000000",
    });
    expect(result["--background"]).toBeDefined();
    expect(result["--text-color"]).toBeDefined();
    expect(result["--accent-color"]).toBeDefined();
    expect(result["--font"]).toBeDefined();
    expect(result["--heading-font"]).toBeDefined();
    expect(result["--code-font"]).toBeDefined();
    expect(result["--border-color"]).toBeDefined();
  });
});

describe("getThemeStyles", () => {
  test("returns CSS properties from theme", () => {
    const result = getThemeStyles(THEME, {});
    expect(result["--background"]).toBe(
      "color(display-p3 1.0000 1.0000 1.0000)",
    );
    expect(result["--text-color"]).toBe(
      "color(display-p3 0.0000 0.0000 0.0000)",
    );
  });

  test("applies overrides", () => {
    const result = getThemeStyles(THEME, {
      background: { type: "color", color: "ffff80008000" },
    });
    expect(result["--background"]).toBe(
      "color(display-p3 1.0000 0.5000 0.5000)",
    );
  });
});

describe("getThemeColors", () => {
  test("always includes text and accent colors", () => {
    const result = getThemeColors(THEME);
    expect(result).toContainEqual({ name: "Text", color: THEME.colors.text });
    expect(result).toContainEqual({
      name: "Accent",
      color: THEME.colors.accent,
    });
  });

  test("includes background color for color fills", () => {
    const result = getThemeColors(THEME);
    expect(result).toContainEqual({
      name: "Background",
      color: "ffffffffffff",
    });
  });

  test("excludes background for gradient fills", () => {
    const theme: Theme = {
      ...THEME,
      background: {
        type: "gradient",
        colorA: "ff0000000000",
        colorB: "0000ffffffff",
        direction: "VERTICAL",
      },
    };
    const result = getThemeColors(theme);
    expect(result.find((c) => c.name === "Background")).toBeUndefined();
  });

  test("excludes background when null", () => {
    const theme: Theme = { ...THEME, background: null };
    const result = getThemeColors(theme);
    expect(result.find((c) => c.name === "Background")).toBeUndefined();
  });

  test("includes border color when set", () => {
    const theme: Theme = { ...THEME, border: "ff00ff00ff00" };
    const result = getThemeColors(theme);
    expect(result).toContainEqual({
      name: "Border",
      color: "ff00ff00ff00",
    });
  });

  test("excludes border when null", () => {
    const result = getThemeColors(THEME);
    expect(result.find((c) => c.name === "Border")).toBeUndefined();
  });
});

describe("getPageBodyStyle", () => {
  function docWithTheme(theme: Theme = THEME): Y.Doc {
    const doc = new Y.Doc();
    doc.getMap("themes").set(theme.id, theme);
    doc.getMap("metadata").set("themeId", theme.id);
    return doc;
  }

  test("resolves CSS properties from the doc theme snapshot", () => {
    const doc = docWithTheme();
    const result = getPageBodyStyle(doc);

    expect(result["--background"]).toBe(
      "color(display-p3 1.0000 1.0000 1.0000)",
    );
    expect(result["--text-color"]).toBe(
      "color(display-p3 0.0000 0.0000 0.0000)",
    );
  });

  test("doc backgroundColor metadata overrides the theme background", () => {
    const doc = docWithTheme();
    doc.getMap("metadata").set("backgroundColor", "ffff80008000");
    const result = getPageBodyStyle(doc);

    expect(result["--background"]).toBe(
      "color(display-p3 1.0000 0.5000 0.5000)",
    );
  });

  test("doc font metadata overrides the theme body font", () => {
    const doc = docWithTheme();
    doc.getMap("metadata").set("font", "lora");
    const result = getPageBodyStyle(doc);

    expect(result["--font"]).toBe('"Lora", serif');
  });

  test("renders nothing when themeId is unset and no overrides are set", () => {
    const doc = new Y.Doc();
    const result = getPageBodyStyle(doc);

    expect(result["--background"]).toBeUndefined();
    expect(result["--text-color"]).toBeUndefined();
    expect(result["--font"]).toBeUndefined();
  });

  test("uses overrides even when the themeId is unknown to the doc", () => {
    const doc = new Y.Doc();
    doc.getMap("metadata").set("themeId", "missing-id");
    doc.getMap("metadata").set("backgroundColor", "ffff80008000");
    doc.getMap("metadata").set("font", "inter");
    const result = getPageBodyStyle(doc);

    expect(result["--background"]).toBe(
      "color(display-p3 1.0000 0.5000 0.5000)",
    );
    expect(result["--font"]).toBe('"Inter", sans-serif');
  });
});
