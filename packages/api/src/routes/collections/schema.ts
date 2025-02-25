import { z } from "zod";
import { CollectionType } from "@prisma/client";

export const CreateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  collectionId: z.string().uuid(),
  type: z.nativeEnum(CollectionType).optional(),
  title: z.string().optional(),
  tileIds: z.array(z.string().uuid()).max(20).optional(),
});
export type CreateCollectionSchema = z.infer<typeof CreateCollectionSchema>;

export const UpdateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  title: z.string().optional(),
});
export type UpdateCollectionSchema = z.infer<typeof UpdateCollectionSchema>;
