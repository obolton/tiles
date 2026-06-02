import { z } from "zod";
import { CreateTileSchema } from "@/schema/Tile";

export const CreateLinkSchema = z.strictObject({
  ...CreateTileSchema.shape,
  url: z.url(),
});
export type CreateLinkSchema = z.infer<typeof CreateLinkSchema>;

export const GetLinkMetadataSchema = z.strictObject({
  pageId: z.uuid(),
  url: z.url(),
});
export type GetLinkMetadataSchema = z.infer<typeof GetLinkMetadataSchema>;
