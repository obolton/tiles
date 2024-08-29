import { z } from "zod";

export const MediaTypeSchema = z.enum(["image", "profile-image"]);
export type MediaTypeSchema = z.infer<typeof MediaTypeSchema>;
