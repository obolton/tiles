import { z } from "zod";

export const CreatePageLinkSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  linkedPageId: z.uuid(),
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
