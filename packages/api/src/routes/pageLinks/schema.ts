import { z } from "zod";

export const CreatePageLinkSchema = z.object({
  pageId: z.string().uuid(),
  linkedPageId: z.string().uuid(),
});
export type CreatePageLinkSchema = z.infer<typeof CreatePageLinkSchema>;
