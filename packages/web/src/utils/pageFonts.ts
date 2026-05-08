import { DEFAULT_FONT, type FontId } from "api/config/fonts";
import { getFontPreload } from "@/utils/fonts";
import { getRichTextFonts } from "@/utils/richText/fonts";
import type { Link } from "@/router/router";
import type { PageData } from "@/models/Page";

export function getPageFonts(pageData: PageData): Set<FontId> {
  const fonts = new Set<FontId>();
  if (pageData.font) {
    fonts.add(pageData.font);
  }

  if (pageData.theme) {
    fonts.add(pageData.theme.fonts.heading);
    fonts.add(pageData.theme.fonts.body);
    fonts.add(pageData.theme.fonts.code);
  }

  for (const tile of pageData.tiles) {
    if (tile.theme) {
      fonts.add(tile.theme.fonts.heading);
      fonts.add(tile.theme.fonts.body);
      fonts.add(tile.theme.fonts.code);
    }
    if (tile.type === "TEXT") {
      for (const id of getRichTextFonts(tile.content)) {
        fonts.add(id);
      }
    } else if (tile.type === "IMAGE" && tile.text) {
      for (const id of getRichTextFonts(tile.text)) {
        fonts.add(id);
      }
    }
  }

  return fonts;
}

export function getPagePreloads(pageData: PageData): Link[] {
  const bodyFontId =
    pageData.font ?? pageData.theme?.fonts.body ?? DEFAULT_FONT;
  const headingFontId = pageData.theme?.fonts.heading ?? bodyFontId;

  const preloads: Link[] = [getFontPreload(bodyFontId)];

  if (headingFontId !== bodyFontId) {
    preloads.push(getFontPreload(headingFontId));
  }

  return preloads;
}
