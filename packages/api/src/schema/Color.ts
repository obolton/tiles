import { z } from "zod";

export const ColorSchema = z
  .hex()
  .length(12)
  .meta({ description: "A 48-bit color RGB hex value" });

export type ColorSchema = z.infer<typeof ColorSchema>;
