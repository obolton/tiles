import { describe, expect, test } from "vitest";
import { resolveThemeStyles, toCSSProperties, getThemeStyles } from "../themes";
import { THEME } from "@/test/fixtures/Theme";

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
      expect(result.font).toBe('"Inter", "sans-serif"');
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
        font: "CLASSIC",
      });
      expect(result.font).toBe('"Lora", "serif"');
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

  describe("with null theme", () => {
    test("returns override values when theme is null", () => {
      const result = resolveThemeStyles(null, {
        background: { type: "color", color: "ff0000000000" },
        textColor: "00ff00000000",
        accentColor: "0000ff000000",
        font: "CODE",
      });
      expect(result.background).toEqual({
        type: "color",
        color: "ff0000000000",
      });
      expect(result.textColor).toBe("00ff00000000");
      expect(result.accentColor).toBe("0000ff000000");
      expect(result.font).toBe('"JetBrains Mono", "monospace"');
    });

    test("returns null for all properties when no overrides", () => {
      const result = resolveThemeStyles(null, {});
      expect(result.background).toBeNull();
      expect(result.textColor).toBeNull();
      expect(result.accentColor).toBeNull();
      expect(result.font).toBeNull();
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
      borderColor: null,
      borderRadius: null,
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
      borderColor: null,
      borderRadius: null,
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
      borderColor: null,
      borderRadius: null,
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
      font: '"Inter", "sans-serif"',
      borderColor: null,
      borderRadius: null,
    });
    expect(result["--font"]).toBe('"Inter", "sans-serif"');
  });

  test("omits properties with null values", () => {
    const result = toCSSProperties({
      background: null,
      textColor: null,
      accentColor: null,
      font: null,
      borderColor: null,
      borderRadius: null,
    });
    expect(result["--background"]).toBeUndefined();
    expect(result["--text-color"]).toBeUndefined();
    expect(result["--accent-color"]).toBeUndefined();
    expect(result["--font"]).toBeUndefined();
    expect(result["--border-color"]).toBeUndefined();
    expect(result["--border-radius"]).toBeUndefined();
  });

  test("includes all properties when all values are set", () => {
    const result = toCSSProperties({
      background: { type: "color", color: "ffffffffffff" },
      textColor: "000000000000",
      accentColor: "0000ffffffff",
      font: '"Inter", "sans-serif"',
      borderColor: "000000000000",
      borderRadius: 12,
    });
    expect(result["--background"]).toBeDefined();
    expect(result["--text-color"]).toBeDefined();
    expect(result["--accent-color"]).toBeDefined();
    expect(result["--font"]).toBeDefined();
    expect(result["--border-color"]).toBeDefined();
    expect(result["--border-radius"]).toBe("12px");
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
