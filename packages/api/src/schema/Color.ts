import { z } from "zod";

export const ColorSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{12}$/)
  .meta({
    description: 'An P-3 RGB color hex string with 16 bits per channel (e.g. "ffff0000aaaa")',
  });

export type ColorSchema = z.infer<typeof ColorSchema>;
