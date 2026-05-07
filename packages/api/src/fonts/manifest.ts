import { z } from "zod";

export const ManifestWeightSchema = z.union([
  z.number().int(),
  z.strictObject({
    min: z.number().int(),
    max: z.number().int(),
  }),
]);
export type ManifestWeight = z.infer<typeof ManifestWeightSchema>;

export const ManifestFileSchema = z.strictObject({
  weight: ManifestWeightSchema,
  style: z.string(),
  subset: z.string(),
  path: z.string(),
});
export type ManifestFile = z.infer<typeof ManifestFileSchema>;

export const ManifestFontSchema = z.strictObject({
  family: z.string(),
  version: z.string(),
  files: z.array(ManifestFileSchema),
});
export type ManifestFont = z.infer<typeof ManifestFontSchema>;

export const FontsManifestSchema = z.strictObject({
  syncedAt: z.string(),
  fonts: z.record(z.string(), ManifestFontSchema),
});
export type FontsManifest = z.infer<typeof FontsManifestSchema>;
