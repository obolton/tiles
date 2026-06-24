import { z } from "zod";

export const GetLinkMetadataSchema = z.strictObject({
  pageId: z.uuid(),
  url: z.url(),
});
export type GetLinkMetadataSchema = z.infer<typeof GetLinkMetadataSchema>;
