import { z } from "zod";

export const CreateCollectionSchema = z.object({
  title: z.string().optional(),
  items: z.array(z.string().uuid()).optional(),
});
export type CreateCollectionSchema = z.infer<typeof CreateCollectionSchema>;

export const DeleteCollectionSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteCollectionSchema = z.infer<typeof DeleteCollectionSchema>;

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
