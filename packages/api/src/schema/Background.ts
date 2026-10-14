import { z } from "zod";
import { ColorSchema } from "./Color";
import { GradientDirection } from "@/generated/prisma/client";

export const ColorBackgroundSchema = z.object({
  type: z.literal("color"),
  color: ColorSchema,
});

export const GradientBackgroundSchema = z.object({
  type: z.literal("gradient"),
  colorA: ColorSchema,
  colorB: ColorSchema,
  direction: z.enum(GradientDirection),
});

export const ImageBackgroundSchema = z.object({
  type: z.literal("image"),
  imageId: z.uuid(),
});

export const BackgroundSchema = z.discriminatedUnion("type", [
  ColorBackgroundSchema,
  GradientBackgroundSchema,
  ImageBackgroundSchema,
]);

export type BackgroundSchema = z.infer<typeof BackgroundSchema>;
