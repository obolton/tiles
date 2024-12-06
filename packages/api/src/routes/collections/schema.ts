import { z } from "zod";

export const CreateCollectionSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().optional(),
  tileIds: z.array(z.string().uuid()).optional(),
});
export type CreateCollectionSchema = z.infer<typeof CreateCollectionSchema>;

export const AddToCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  tileId: z.string().uuid(),
});
export type AddToCollectionSchema = z.infer<typeof AddToCollectionSchema>;

export const RemoveFromCollectionSchema = z.object({
  id: z.string().uuid(),
  collectionId: z.string().uuid(),
});
export type RemoveFromCollectionSchema = z.infer<
  typeof RemoveFromCollectionSchema
>;
