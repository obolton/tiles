import { z } from "zod";
import { PositionSchema } from "@/schema/Position.ts";

export const CreateLinkSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  url: z.url(),
  ...PositionSchema.shape,
});
export type CreateLinkSchema = z.infer<typeof CreateLinkSchema>;

export const UpdateLinkSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  url: z.url(),
});
export type UpdateLinkSchema = z.infer<typeof UpdateLinkSchema>;
