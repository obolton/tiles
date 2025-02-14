import { z } from "zod";

export const CreatePageLinkSchema = z.object({
  pageId: z.string().uuid(),
  collectionId: z.string().uuid().optional(),
  linkedPageId: z.string().uuid(),
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
