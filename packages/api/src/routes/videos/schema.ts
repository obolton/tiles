import { z } from "zod";

export const GetVideoMetadataSchema = z.strictObject({
  pageId: z.uuid(),
  url: z.url(),
});
export type GetVideoMetadataSchema = z.infer<typeof GetVideoMetadataSchema>;
