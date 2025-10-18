import { z } from "zod";
import { TileSchema } from "@/schema/Tile";

export const CreatePageLinkSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  linkedPageId: z.uuid(),
  ...TileSchema.shape,
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
