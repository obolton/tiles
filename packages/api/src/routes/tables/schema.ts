import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CreateTableSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  columns: z.number().int().min(1).max(100),
  rows: z.number().int().max(10),
  background: BackgroundSchema.optional(),
});
export type CreateTableSchema = z.infer<typeof CreateTableSchema>;

export const UpdateTableSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  background: BackgroundSchema.optional(),
});
export type UpdateTableSchema = z.infer<typeof UpdateTableSchema>;

export const InsertRowSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  afterRowId: z.uuid().nullable(),
});
export type InsertRowSchema = z.infer<typeof InsertRowSchema>;

export const MoveRowSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowId: z.uuid(),
  afterRowId: z.uuid().nullable(),
});
export type MoveRowSchema = z.infer<typeof MoveRowSchema>;

export const DeleteRowSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowId: z.uuid(),
});
export type DeleteRowSchema = z.infer<typeof DeleteRowSchema>;

export const InsertColumnSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  width: z.number().min(16).max(800).optional(),
  afterColumnId: z.uuid().nullable(),
});
export type InsertColumnSchema = z.infer<typeof InsertColumnSchema>;

export const MoveColumnSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  columnId: z.uuid(),
  afterColumnId: z.uuid().nullable(),
});
export type MoveColumnSchema = z.infer<typeof MoveColumnSchema>;

export const UpdateColumnSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  columnId: z.uuid(),
  width: z.number().min(16).max(800).optional(),
});
export type UpdateColumnSchema = z.infer<typeof UpdateColumnSchema>;

export const DeleteColumnSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  columnId: z.uuid(),
});
export type DeleteColumnSchema = z.infer<typeof DeleteColumnSchema>;

export const UpdateCellSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowId: z.uuid(),
  columnId: z.uuid(),
  value: z.union([z.string(), RichTextSchema]).nullable(),
});
export type UpdateCellSchema = z.infer<typeof UpdateCellSchema>;
