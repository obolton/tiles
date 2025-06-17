import { z } from "zod";
import { CollectionLayout, CollectionWidth } from "@prisma/client";

export const UpdateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  layout: z.nativeEnum(CollectionLayout).optional(),
  width: z.nativeEnum(CollectionWidth).optional(),
  title: z.string().optional(),
});
export type UpdateCollectionSchema = z.infer<typeof UpdateCollectionSchema>;
