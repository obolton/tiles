import { z } from "zod";

export const DeleteTilesSchema = z.object({
  pageId: z.uuid(),
  ids: z.array(z.uuid()).min(1).max(20),
});
export type DeleteTilesSchema = z.infer<typeof DeleteTilesSchema>;
