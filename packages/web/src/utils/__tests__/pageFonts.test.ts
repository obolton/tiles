import { describe, expect, test } from "vitest";
import { getPageFonts, getPagePreloads } from "../pageFonts";
import { PAGE } from "@/test/fixtures/Page";
import { THEME } from "@/test/fixtures/Theme";
import { TILE, TEXT_TILE, IMAGE_TILE } from "@/test/fixtures/Tile";

describe("getPageFonts", () => {
  test("returns an empty set for a bare page", () => {
    expect(
      getPageFonts({ ...PAGE, font: null, theme: null, tiles: [] }),
    ).toEqual(new Set());
  });

  test("includes page.font override", () => {
    expect(getPageFonts({ ...PAGE, font: "lora", theme: null })).toEqual(
      new Set(["lora"]),
    );
  });

  test("includes all three theme fonts", () => {
    expect(
      getPageFonts({ ...PAGE, font: null, theme: THEME, tiles: [] }),
    ).toEqual(new Set(["lora", "inter", "jetbrains-mono"]));
  });

  test("includes fonts from tiles with their own themes", () => {
    const tile = {
      ...TILE,
      theme: {
        ...THEME,
        fonts: {
          heading: "quicksand" as const,
          body: "quicksand" as const,
          code: "jetbrains-mono" as const,
        },
      },
    };
    expect(
      getPageFonts({ ...PAGE, font: null, theme: null, tiles: [tile] }),
    ).toEqual(new Set(["quicksand", "jetbrains-mono"]));
  });

  test("merges page-level and tile-level fonts", () => {
    const tile = {
      ...TILE,
      theme: {
        ...THEME,
        fonts: {
          heading: "dynapuff" as const,
          body: "dynapuff" as const,
          code: "dynapuff" as const,
        },
      },
    };
    expect(
      getPageFonts({ ...PAGE, font: "lora", theme: THEME, tiles: [tile] }),
    ).toEqual(new Set(["lora", "inter", "jetbrains-mono", "dynapuff"]));
  });

  test("ignores tiles without a theme", () => {
    expect(
      getPageFonts({
        ...PAGE,
        font: null,
        theme: null,
        tiles: [{ ...TILE, theme: null }],
      }),
    ).toEqual(new Set());
  });

  test("includes fonts from font marks in TextTile content", () => {
    const tile = {
      ...TEXT_TILE,
      content: [
        {
          type: "paragraph" as const,
          align: 0 as const,
          children: [
            {
              type: "text" as const,
              text: "Hi",
              format: 0,
              font: "lora" as const,
            },
          ],
        },
      ],
    };
    expect(
      getPageFonts({ ...PAGE, font: null, theme: null, tiles: [tile] }),
    ).toEqual(new Set(["lora"]));
  });

  test("includes fonts from font marks in ImageTile text", () => {
    const tile = {
      ...IMAGE_TILE,
      text: [
        {
          type: "paragraph" as const,
          align: 0 as const,
          children: [
            {
              type: "text" as const,
              text: "Caption",
              format: 0,
              font: "quicksand" as const,
            },
          ],
        },
      ],
    };
    expect(
      getPageFonts({ ...PAGE, font: null, theme: null, tiles: [tile] }),
    ).toEqual(new Set(["quicksand"]));
  });

  test("merges mark fonts with theme fonts", () => {
    const tile = {
      ...TEXT_TILE,
      content: [
        {
          type: "paragraph" as const,
          align: 0 as const,
          children: [
            {
              type: "text" as const,
              text: "Hi",
              format: 0,
              font: "dynapuff" as const,
            },
          ],
        },
      ],
    };
    expect(
      getPageFonts({ ...PAGE, font: null, theme: THEME, tiles: [tile] }),
    ).toEqual(new Set(["lora", "inter", "jetbrains-mono", "dynapuff"]));
  });
});

describe("getPagePreloads", () => {
  test("preloads the default font when nothing is set", () => {
    const preloads = getPagePreloads({ ...PAGE, font: null, theme: null });
    expect(preloads).toHaveLength(1);
    expect(preloads[0]?.href).toContain("inter-latin-wght-normal");
    expect(preloads[0]?.as).toBe("font");
  });

  test("respects page.font override", () => {
    const preloads = getPagePreloads({ ...PAGE, font: "lora", theme: null });
    expect(preloads).toHaveLength(1);
    expect(preloads[0]?.href).toContain("lora-latin-wght-normal");
  });

  test("falls back to theme.fonts.body when no page.font", () => {
    const preloads = getPagePreloads({
      ...PAGE,
      font: null,
      theme: {
        ...THEME,
        fonts: {
          heading: "lora" as const,
          body: "quicksand" as const,
          code: "jetbrains-mono" as const,
        },
      },
    });
    expect(preloads).toHaveLength(2);
    expect(preloads[0]?.href).toContain("quicksand-latin-wght-normal");
    expect(preloads[1]?.href).toContain("lora-latin-wght-normal");
  });

  test("emits one preload when heading and body are the same font", () => {
    const preloads = getPagePreloads({
      ...PAGE,
      font: null,
      theme: {
        ...THEME,
        fonts: {
          heading: "inter" as const,
          body: "inter" as const,
          code: "jetbrains-mono" as const,
        },
      },
    });
    expect(preloads).toHaveLength(1);
    expect(preloads[0]?.href).toContain("inter-latin-wght-normal");
  });
});
