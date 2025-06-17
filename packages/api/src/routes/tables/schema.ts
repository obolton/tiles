import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";

export const CreateTableSchema = z.object({
  pageId: z.string().uuid(),
  collectionId: z.string().uuid(),
  numColumns: z.number().int().min(1).max(100),
  numRows: z.number().int().max(10),
});
export type CreateTableSchema = z.infer<typeof CreateTableSchema>;

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
  width: z.number().min(16).max(800).optional(),
});
export type AppendColumnSchema = z.infer<typeof AppendColumnSchema>;

export const UpdateColumnSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
  columnId: z.string().uuid(),
  width: z.number().min(16).max(800).optional(),
});
export type UpdateColumnSchema = z.infer<typeof UpdateColumnSchema>;

export const DeleteColumnSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
  columnId: z.string().uuid(),
});
export type DeleteColumnSchema = z.infer<typeof DeleteColumnSchema>;

export const UpdateCellSchema = z.object({
  pageId: z.string().uuid(),
  tableId: z.string().uuid(),
  rowId: z.string().uuid(),
  columnId: z.string().uuid(),
  value: z.union([z.string(), RichTextSchema]).nullable(),
});
export type UpdateCellSchema = z.infer<typeof UpdateCellSchema>;
