import { z } from "zod";

export const ColorSchema = z.object({
  l: z.number().gte(0).lte(1).meta({
    description: "Luminosity in Oklch color space, e.g. 0.8",
  }),
  c: z
    .number()
    .gte(0)
    .lte(0.4)
    .meta({ description: "Chroma in Oklch color space, e.g. 0.2" }),
  h: z
    .number()
    .gte(0)
    .lte(360)
    .meta({ description: "Hue in degrees in Oklch color space, e.g. 120" }),
});

export type ColorSchema = z.infer<typeof ColorSchema>;
