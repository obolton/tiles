import { z } from "zod";
import { CreateTileSchema } from "@/schema/Tile";

export const CreatePageLinkSchema = z.strictObject({
  ...CreateTileSchema.shape,
  linkedPageId: z.uuid(),
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
