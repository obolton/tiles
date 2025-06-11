import { z } from "zod";
import {
  CollectionType,
  CollectionLayout,
  CollectionWidth,
} from "@prisma/client";

export const CreateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  collectionId: z.string().uuid(),
  type: z.nativeEnum(CollectionType).optional(),
  layout: z.nativeEnum(CollectionLayout).optional(),
  width: z.nativeEnum(CollectionWidth).optional(),
  title: z.string().optional(),
  tileIds: z.array(z.string().uuid()).max(20).optional(),
});
export type CreateCollectionSchema = z.infer<typeof CreateCollectionSchema>;

export const UpdateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  layout: z.nativeEnum(CollectionLayout).optional(),
  width: z.nativeEnum(CollectionWidth).optional(),
  title: z.string().optional(),
});
export type UpdateCollectionSchema = z.infer<typeof UpdateCollectionSchema>;
