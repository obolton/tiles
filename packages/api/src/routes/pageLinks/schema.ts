import { z } from "zod";
import { TileSchema } from "@/schema/Tile";

export const CreatePageLinkSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid().nullable().optional(),
  linkedPageId: z.uuid(),
  ...TileSchema.shape,
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
