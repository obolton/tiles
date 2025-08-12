import { z } from "zod";

export const ColorSchema = z.object({
  l: z.number().gte(0).lte(1),
  c: z.number().gte(0).lte(0.4),
  h: z.number().gte(0).lte(360),
});

export type ColorSchema = z.infer<typeof ColorSchema>;
