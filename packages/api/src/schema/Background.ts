import { z } from "zod";

export const ImageBackgroundSchema = z.object({
  imageKey: z.string(),
});

export const ColorBackgroundSchema = z.object({
  color: z.object({
    l: z.number().gte(0).lte(1),
    c: z.number().gte(0).lte(0.4),
    h: z.number().gte(0).lte(360),
  }),
});

export const BackgroundSchema = z
  .union([ImageBackgroundSchema, ColorBackgroundSchema])
  .nullable();
