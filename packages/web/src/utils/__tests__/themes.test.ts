import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import {
  getThemeStyles,
  applyThemeStyles,
  getThemeColors,
  getPageTheme,
  DEFAULT_THEME_VALUES,
} from "../themes";
import { THEME } from "@/test/fixtures/Theme";
import { toCSSColor } from "@/utils/color";
import type { ThemeData } from "../themes";

const GRADIENT_THEME: ThemeData = {
  ...THEME,
  background: {
    type: "gradient",
    colorA: "ffff00000000",
    colorB: "0000ffffffff",
    direction: "VERTICAL",
  },
};

describe("getThemeStyles", () => {
  test("resolves a solid background into a colour with no image", () => {
    const styles = getThemeStyles(THEME);

    expect(styles["--background-color"]).toBe("color(display-p3 1.0000 1.0000 1.0000)");
    expect(styles["--background-image"]).toBe("none");
  });

  test("resolves a gradient background into its first colour and the gradient", () => {
    const styles = getThemeStyles(GRADIENT_THEME);

    expect(styles["--background-color"]).toBe("color(display-p3 1.0000 0.0000 0.0000)");
    expect(styles["--background-image"]).toBe(
      "linear-gradient(to bottom in oklch, color(display-p3 1.0000 0.0000 0.0000), color(display-p3 0.0000 1.0000 1.0000))",
    );
  });

  test("resolves the theme colours and fonts", () => {
    const styles = getThemeStyles(THEME);

    expect(styles["--text-color"]).toBe("color(display-p3 0.0000 0.0000 0.0000)");
    expect(styles["--accent-color"]).toBe("color(display-p3 0.0000 1.0000 1.0000)");
    expect(styles["--font"]).toBe('"Inter", sans-serif');
    expect(styles["--heading-font"]).toBe('"Lora", serif');
    expect(styles["--code-font"]).toBe('"JetBrains Mono", monospace');
  });

  test("leaves the border colour unset without an override", () => {
    expect(getThemeStyles(THEME)["--border-color"]).toBeUndefined();
  });

  test("prefers overrides over the theme values", () => {
    const styles = getThemeStyles(THEME, {
      background: { type: "color", color: "ffff80008000" },
      textColor: "0000ffff0000",
      borderColor: "ffff00000000",
    });

    expect(styles["--background-color"]).toBe("color(display-p3 1.0000 0.5000 0.5000)");
    expect(styles["--text-color"]).toBe("color(display-p3 0.0000 1.0000 0.0000)");
    expect(styles["--border-color"]).toBe("color(display-p3 1.0000 0.0000 0.0000)");
  });

  test("ignores null overrides", () => {
    const styles = getThemeStyles(THEME, { background: null, textColor: null });

    expect(styles["--background-color"]).toBe("color(display-p3 1.0000 1.0000 1.0000)");
    expect(styles["--text-color"]).toBe("color(display-p3 0.0000 0.0000 0.0000)");
  });

  test("keeps the theme colour under an image background override", () => {
    const styles = getThemeStyles(THEME, { background: { type: "image", imageId: "image-1" } });

    expect(styles["--background-image"]).toMatch(/^url\(/);
    expect(styles["--background-color"]).toBe("color(display-p3 1.0000 1.0000 1.0000)");
  });

  test("applies overrides without a theme", () => {
    const styles = getThemeStyles(null, {
      background: { type: "color", color: "ffff00000000" },
      textColor: "0000ffff0000",
    });

    expect(styles["--background-color"]).toBe("color(display-p3 1.0000 0.0000 0.0000)");
    expect(styles["--background-image"]).toBe("none");
    expect(styles["--text-color"]).toBe("color(display-p3 0.0000 1.0000 0.0000)");
    expect(styles["--accent-color"]).toBeUndefined();
    expect(styles["--font"]).toBeUndefined();
  });

  test("emits every property as undefined without a theme or overrides", () => {
    const styles = getThemeStyles(null);

    expect(Object.keys(styles)).toHaveLength(8);
    expect(Object.values(styles).every((value) => value === undefined)).toBe(true);
  });
});

describe("applyThemeStyles", () => {
  test("sets the given properties and removes the unset ones", () => {
    const element = document.createElement("div");
    element.style.setProperty("--border-color", "red");

    applyThemeStyles(element, getThemeStyles(THEME));

    expect(element.style.getPropertyValue("--text-color")).toBe(
      "color(display-p3 0.0000 0.0000 0.0000)",
    );
    expect(element.style.getPropertyValue("--border-color")).toBe("");
  });
});

describe("getThemeColors", () => {
  test("includes the text, accent and background colours of a solid theme", () => {
    expect(getThemeColors(THEME)).toEqual([
      { name: "Text", color: THEME.colors.text },
      { name: "Accent", color: THEME.colors.accent },
      { name: "Background", color: "ffffffffffff" },
    ]);
  });

  test("excludes the background of a gradient theme", () => {
    expect(getThemeColors(GRADIENT_THEME).map((c) => c.name)).toEqual(["Text", "Accent"]);
  });
});

describe("getPageTheme", () => {
  test("returns the snapshot referenced by the page", () => {
    const doc = new Y.Doc();
    doc.getMap("themes").set(THEME.id, THEME);
    doc.getMap("metadata").set("themeId", THEME.id);

    expect(getPageTheme(doc)).toEqual(THEME);
  });

  test("returns null when the page has no theme", () => {
    expect(getPageTheme(new Y.Doc())).toBeNull();
  });

  test("returns null when the snapshot is missing", () => {
    const doc = new Y.Doc();
    doc.getMap("metadata").set("themeId", "missing");

    expect(getPageTheme(doc)).toBeNull();
  });
});

describe("DEFAULT_THEME_VALUES", () => {
  test("starts from a blue accent on dark text", () => {
    expect(DEFAULT_THEME_VALUES.colors).toEqual({ text: "1a1a1a1a1a1a", accent: "00006666ffff" });
    expect(toCSSColor(DEFAULT_THEME_VALUES.colors.accent)).toBe(
      "color(display-p3 0.0000 0.4000 1.0000)",
    );
  });

  test("starts from a white background with the default fonts", () => {
    expect(DEFAULT_THEME_VALUES.background).toEqual({ type: "color", color: "ffffffffffff" });
    expect(DEFAULT_THEME_VALUES.fonts).toEqual({
      heading: "inter",
      body: "inter",
      code: "jetbrains-mono",
    });
  });
});
