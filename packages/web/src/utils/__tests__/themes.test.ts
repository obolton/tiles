import { describe, expect, test } from "vitest";
import { resolveThemeStyles, toCSSProperties, getThemeStyles } from "../themes";
import { THEME } from "@/test/fixtures/Theme";

describe("resolveThemeStyles", () => {
  describe("with theme and no overrides", () => {
    test("returns theme background color", () => {
      const result = resolveThemeStyles(THEME, {});
      expect(result.backgroundColor).toBe("ffffffffffff");
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
        backgroundColor: "ff0000000000",
      });
      expect(result.backgroundColor).toBe("ff0000000000");
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
        backgroundColor: null,
      });
      expect(result.backgroundColor).toBe("ffffffffffff");
    });
  });

  describe("with null theme", () => {
    test("returns override values when theme is null", () => {
      const result = resolveThemeStyles(null, {
        backgroundColor: "ff0000000000",
        textColor: "00ff00000000",
        accentColor: "0000ff000000",
        font: "CODE",
      });
      expect(result.backgroundColor).toBe("ff0000000000");
      expect(result.textColor).toBe("00ff00000000");
      expect(result.accentColor).toBe("0000ff000000");
      expect(result.font).toBe('"JetBrains Mono", "monospace"');
    });

    test("returns null for all properties when no overrides", () => {
      const result = resolveThemeStyles(null, {});
      expect(result.backgroundColor).toBeNull();
      expect(result.textColor).toBeNull();
      expect(result.accentColor).toBeNull();
      expect(result.font).toBeNull();
    });
  });
});

describe("toCSSProperties", () => {
  test("converts background color to CSS custom property", () => {
    const result = toCSSProperties({
      backgroundColor: "ffff80008000",
      textColor: null,
      accentColor: null,
      font: null,
    });
    expect(result["--background-color"]).toBe(
      "color(display-p3 1.0000 0.5000 0.5000)",
    );
  });

  test("converts text color to CSS custom property", () => {
    const result = toCSSProperties({
      backgroundColor: null,
      textColor: "000000000000",
      accentColor: null,
      font: null,
    });
    expect(result["--text-color"]).toBe(
      "color(display-p3 0.0000 0.0000 0.0000)",
    );
  });

  test("converts accent color to CSS custom property", () => {
    const result = toCSSProperties({
      backgroundColor: null,
      textColor: null,
      accentColor: "0000ffffffff",
      font: null,
    });
    expect(result["--accent-color"]).toBe(
      "color(display-p3 0.0000 1.0000 1.0000)",
    );
  });

  test("includes font as CSS custom property", () => {
    const result = toCSSProperties({
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      font: '"Inter", "sans-serif"',
    });
    expect(result["--font"]).toBe('"Inter", "sans-serif"');
  });

  test("omits properties with null values", () => {
    const result = toCSSProperties({
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      font: null,
    });
    expect(result["--background-color"]).toBeUndefined();
    expect(result["--text-color"]).toBeUndefined();
    expect(result["--accent-color"]).toBeUndefined();
    expect(result["--font"]).toBeUndefined();
  });

  test("includes all properties when all values are set", () => {
    const result = toCSSProperties({
      backgroundColor: "ffffffffffff",
      textColor: "000000000000",
      accentColor: "0000ffffffff",
      font: '"Inter", "sans-serif"',
    });
    expect(result["--background-color"]).toBeDefined();
    expect(result["--text-color"]).toBeDefined();
    expect(result["--accent-color"]).toBeDefined();
    expect(result["--font"]).toBeDefined();
  });
});

describe("getThemeStyles", () => {
  test("returns CSS properties from theme", () => {
    const result = getThemeStyles(THEME, {});
    expect(result["--background-color"]).toBe(
      "color(display-p3 1.0000 1.0000 1.0000)",
    );
    expect(result["--text-color"]).toBe(
      "color(display-p3 0.0000 0.0000 0.0000)",
    );
  });

  test("applies overrides", () => {
    const result = getThemeStyles(THEME, {
      backgroundColor: "ffff80008000",
    });
    expect(result["--background-color"]).toBe(
      "color(display-p3 1.0000 0.5000 0.5000)",
    );
  });
});
