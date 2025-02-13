import { z } from "zod";

export const CreateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().optional(),
  block: z.boolean().optional(),
  tileIds: z.array(z.string().uuid()).min(2).max(20),
});
export type CreateCollectionSchema = z.infer<typeof CreateCollectionSchema>;
