import { z } from "zod";
import fontsJson from "./fonts.json" with { type: "json" };

const FONT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const FontConfigSchema = z
  .object({
    id: z.string().regex(FONT_ID_PATTERN, "Font id must be kebab-case"),
    family: z.string().min(1),
    category: z.enum(["sans-serif", "serif", "monospace", "display"]),
    fallback: z.string().min(1),
    weights: z.array(z.number().int().positive()).nonempty(),
    opticalSizing: z.boolean().optional(),
  })
  .transform((font) => ({
    ...font,
    previewFamily: `${font.family} Preview`,
  }));

export type FontConfig = z.infer<typeof FontConfigSchema>;
export type FontCategory = FontConfig["category"];

export const FontsSchema = z
  .array(FontConfigSchema)
  .nonempty()
  .refine((fonts) => new Set(fonts.map((font) => font.id)).size === fonts.length, {
    message: "Font IDs must be unique",
  });

export const FONTS: readonly FontConfig[] = FontsSchema.parse(fontsJson);

const FONTS_BY_ID: ReadonlyMap<string, FontConfig> = new Map(FONTS.map((font) => [font.id, font]));

export const FONT_IDS: readonly string[] = FONTS.map((font) => font.id);

export type FontId = string;

export const FontIdSchema = z.enum(FONT_IDS as [string, ...string[]]);

export const DEFAULT_FONT: FontId = "inter";
export const DEFAULT_HEADING_FONT: FontId = "inter";
export const DEFAULT_CODE_FONT: FontId = "jetbrains-mono";

for (const id of [DEFAULT_FONT, DEFAULT_HEADING_FONT, DEFAULT_CODE_FONT]) {
  if (!FONTS_BY_ID.has(id)) {
    throw new Error(`Default font "${id}" is not present in the registry`);
  }
}

export function getFontConfig(id: FontId): FontConfig {
  const config = FONTS_BY_ID.get(id);
  if (!config) {
    throw new Error(`Invalid font: ${id}`);
  }
  return config;
}
