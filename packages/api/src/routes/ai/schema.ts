import { z } from "zod";

export const GenerateImageSchema = z.object({
  prompt: z.string().min(1).max(1024),
});
export type GenerateImageSchema = z.infer<typeof GenerateImageSchema>;

export const WriteSchema = z.object({
  prompt: z.string().min(1).max(1024),
});
export type WriteSchema = z.infer<typeof WriteSchema>;
