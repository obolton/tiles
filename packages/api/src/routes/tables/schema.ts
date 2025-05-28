import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";

export const CreateTableSchema = z.object({
  pageId: z.string().uuid(),
  collectionId: z.string().uuid(),
  numColumns: z.number().int().min(1).max(100),
  numRows: z.number().int().max(10),
});
export type CreateTableSchema = z.infer<typeof CreateTableSchema>;

export const UpdateTableSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  numColumns: z.number().int().min(1).max(100),
});
export type UpdateTableSchema = z.infer<typeof UpdateTableSchema>;

export const AppendRowSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
});
export type AppendRowSchema = z.infer<typeof AppendRowSchema>;

export const DeleteRowSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
  rowId: z.string().uuid(),
});
export type DeleteRowSchema = z.infer<typeof DeleteRowSchema>;

export const AppendColumnSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
});
export type AppendColumnSchema = z.infer<typeof AppendColumnSchema>;

export const DeleteColumnSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
  index: z.number(),
});
export type DeleteColumnSchema = z.infer<typeof DeleteColumnSchema>;

export const UpdateCellSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
  rowId: z.string().uuid(),
  column: z.number().int().min(0),
  value: z.union([z.string(), RichTextSchema]).nullable(),
});
export type UpdateCellSchema = z.infer<typeof UpdateCellSchema>;
