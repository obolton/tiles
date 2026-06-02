import { z } from "zod";
import { TileSchema } from "@/schema/Tile";

export const CreateVideoSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid().nullable().optional(),
  url: z.url(),
  ...TileSchema.shape,
});
export type CreateVideoSchema = z.infer<typeof CreateVideoSchema>;
