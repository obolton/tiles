import manifestJson from "api/fonts/manifest.json" with { type: "json" };
import { FontsManifestSchema, type ManifestWeight } from "api/fonts/manifest";
import type { FontId } from "api/config/fonts";
import type { Link, Style } from "@/router/router";

const MANIFEST = FontsManifestSchema.parse(manifestJson);
const FONTS_BASE_URL = import.meta.env.PUBLIC_FONTS_BASE_URL as string;

function formatWeight(weight: ManifestWeight): string {
  return typeof weight === "number"
    ? String(weight)
    : `${weight.min} ${weight.max}`;
}

function weightMatches(weight: ManifestWeight, target: number): boolean {
  return typeof weight === "number"
    ? weight === target
    : weight.min <= target && target <= weight.max;
}

export function generateFontFaceCSS(fontIds: Iterable<FontId>): Style {
  const declarations: string[] = [];
  for (const id of fontIds) {
    const font = MANIFEST.fonts[id];
    if (!font) {
      continue;
    }

    for (const file of font.files) {
      const url = `${FONTS_BASE_URL}/${file.path}`;
      declarations.push(
        `@font-face{` +
          `font-family:"${font.family}";` +
          `font-style:${file.style};` +
          `font-weight:${formatWeight(file.weight)};` +
          `font-display:swap;` +
          `src:url("${url}") format("woff2")` +
          `}`,
      );
    }
  }

  return { content: declarations.join("") };
}

export function getFontPreload(
  fontId: FontId,
  weight = 400,
  style = "normal",
): Link {
  const font = MANIFEST.fonts[fontId];
  if (!font) {
    throw new Error(`Unknown font: ${fontId}`);
  }

  const file = font.files.find(
    (f) => f.style === style && weightMatches(f.weight, weight),
  );

  if (!file) {
    throw new Error(`No file for ${fontId} (weight ${weight}, style ${style})`);
  }

  return {
    rel: "preload",
    href: `${FONTS_BASE_URL}/${file.path}`,
    as: "font",
    type: "font/woff2",
    crossorigin: true,
  };
}

const loadedFonts = new Set<FontId>();

export async function loadFonts(...ids: FontId[]): Promise<void> {
  if (import.meta.env.SSR) {
    return;
  }

  const tasks: Promise<unknown>[] = [];
  for (const id of ids) {
    const font = MANIFEST.fonts[id];
    if (!font) {
      throw new Error(`Unknown font: ${id}`);
    }

    if (loadedFonts.has(id)) {
      continue;
    }
    loadedFonts.add(id);

    for (const file of font.files) {
      const face = new FontFace(
        font.family,
        `url("${FONTS_BASE_URL}/${file.path}") format("woff2")`,
        {
          weight: formatWeight(file.weight),
          style: file.style,
          display: "swap",
        },
      );
      document.fonts.add(face);
      tasks.push(face.load());
    }
  }

  await Promise.all(tasks);
}

export function clearLoadedFonts() {
  loadedFonts.clear();
}
