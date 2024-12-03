import { z } from "zod";

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
