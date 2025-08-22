import { z } from "zod";
import { PositionSchema } from "@/schema/Position.ts";

export const CreatePageLinkSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  linkedPageId: z.uuid(),
  ...PositionSchema.shape,
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
