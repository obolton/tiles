import { z } from "zod";
import type { FontStyle } from "@/fonts/manifest";

const FONTSOURCE_API = "https://api.fontsource.org/v1";
const FONTSOURCE_CDN = "https://cdn.jsdelivr.net/fontsource/fonts";

const FontsourceFontSchema = z.object({
  family: z.string(),
  version: z.string(),
  variable: z.boolean().optional(),
  styles: z.array(z.string()),
  variants: z.record(z.string(), z.record(z.string(), z.record(z.string(), z.unknown()))),
});

export type FontsourceFont = z.infer<typeof FontsourceFontSchema>;

const FontsourceAxisSchema = z.object({
  default: z.string(),
  min: z.string(),
  max: z.string(),
  step: z.string(),
});

const FontsourceVariableFontSchema = z.object({
  family: z.string(),
  axes: z.record(z.string(), FontsourceAxisSchema),
});

export type FontsourceVariableFont = z.infer<typeof FontsourceVariableFontSchema>;

export async function fetchFontMetadata(id: string): Promise<FontsourceFont> {
  const response = await fetch(`${FONTSOURCE_API}/fonts/${id}`);

  if (!response.ok) {
    throw new Error(`Fontsource API returned ${response.status} for ${id}`);
  }

  return FontsourceFontSchema.parse(await response.json());
}

export async function fetchVariableFontMetadata(
  id: string,
): Promise<FontsourceVariableFont | null> {
  const response = await fetch(`${FONTSOURCE_API}/variable/${id}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Fontsource variable API returned ${response.status} for ${id}`);
  }

  return FontsourceVariableFontSchema.parse(await response.json());
}

export function getFontUrl(
  id: string,
  subset: string,
  weightOrAxis: number | "wght",
  style: FontStyle,
): string {
  const slug = weightOrAxis === "wght" ? `${id}:vf` : id;
  return `${FONTSOURCE_CDN}/${slug}@latest/${subset}-${weightOrAxis}-${style}.woff2`;
}
