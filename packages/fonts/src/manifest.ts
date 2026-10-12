import { z } from "zod";

export const FontStyleSchema = z.enum(["normal", "italic"]);
export type FontStyle = z.infer<typeof FontStyleSchema>;

export const ManifestWeightSchema = z.union([
  z.number().int(),
  z.strictObject({
    min: z.number().int(),
    max: z.number().int(),
  }),
]);
export type ManifestWeight = z.infer<typeof ManifestWeightSchema>;

export const FontVariantSchema = z.strictObject({
  weight: ManifestWeightSchema,
  style: FontStyleSchema,
  subset: z.string(),
  path: z.string(),
});
export type FontVariant = z.infer<typeof FontVariantSchema>;

export const ManifestFontSchema = z.strictObject({
  family: z.string(),
  version: z.string(),
  files: z.array(FontVariantSchema),
  previewPath: z.string(),
});
export type ManifestFont = z.infer<typeof ManifestFontSchema>;

export const FontsManifestSchema = z.strictObject({
  fonts: z.record(z.string(), ManifestFontSchema),
});
export type FontsManifest = z.infer<typeof FontsManifestSchema>;
