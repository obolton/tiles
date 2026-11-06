import * as Y from "yjs";
import { DEFAULT_FONT, type FontId } from "fonts/config";
import { getFontPreload } from "@/utils/fonts";
import { getPageTheme, getPageFont } from "@/utils/themes";
import { getRichTextFonts, getFragmentFonts } from "@/utils/richText/fonts";
import { getBody } from "doc/body";
import type { ThemeData } from "@/models/Theme";
import type { RichText } from "doc/types/richText";
import type { Link } from "@/router/router";

function getTileFonts(tile: Y.Map<unknown>): Set<FontId> {
  switch (tile.get("type")) {
    case "TEXT": {
      const content = tile.get("content");
      return content instanceof Y.XmlFragment ? getFragmentFonts(content) : new Set();
    }
    case "IMAGE": {
      const text = tile.get("text") as RichText | null;
      return text ? getRichTextFonts(text) : new Set();
    }
    default:
      return new Set();
  }
}

export function getPageFonts(doc: Y.Doc): Set<FontId> {
  const fonts = new Set<FontId>();

  const font = getPageFont(doc);
  if (font) {
    fonts.add(font);
  }

  // Themes
  for (const theme of doc.getMap<ThemeData>("themes").values()) {
    fonts.add(theme.fonts.heading);
    fonts.add(theme.fonts.body);
    fonts.add(theme.fonts.code);
  }

  // Inline fonts
  for (const id of getFragmentFonts(getBody(doc))) {
    fonts.add(id);
  }
  for (const tile of doc.getMap<Y.Map<unknown>>("tiles").values()) {
    for (const id of getTileFonts(tile)) {
      fonts.add(id);
    }
  }

  return fonts;
}

export function getPagePreloads(doc: Y.Doc): Link[] {
  const pageTheme = getPageTheme(doc);
  const bodyFontId = getPageFont(doc) ?? pageTheme?.fonts.body ?? DEFAULT_FONT;
  const headingFontId = pageTheme?.fonts.heading ?? bodyFontId;

  const preloads: Link[] = [getFontPreload(bodyFontId)];

  if (headingFontId !== bodyFontId) {
    preloads.push(getFontPreload(headingFontId));
  }

  return preloads;
}
