import { z } from "zod";
import { ColorSchema } from "./Color.ts";

export const ImageBackgroundSchema = z.object({
  imageKey: z.string(),
});

export const ColorBackgroundSchema = z.object({
  color: ColorSchema,
});

export const BackgroundSchema = z
  .union([ImageBackgroundSchema, ColorBackgroundSchema])
  .nullable();

export type BackgroundSchema = z.infer<typeof BackgroundSchema>;
