import { z } from "zod";
import { PositionSchema } from "@/schema/Position.ts";
import { RichTextSchema } from "@/schema/RichText.ts";
import { ColorSchema } from "@/schema/Color.ts";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CreateTableSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  columns: z.number().int().min(1).max(100),
  rows: z.number().int().max(10),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.optional(),
  ...PositionSchema.shape,
});
export type CreateTableSchema = z.infer<typeof CreateTableSchema>;

export const UpdateTableSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.optional(),
});
export type UpdateTableSchema = z.infer<typeof UpdateTableSchema>;

export const InsertRowSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  height: z.number().min(32).max(400).optional(),
  afterRowId: z.uuid().nullable(),
});
export type InsertRowSchema = z.infer<typeof InsertRowSchema>;

export const UpdateRowSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowId: z.uuid(),
  height: z.number().min(32).max(400).optional(),
});
export type UpdateRowSchema = z.infer<typeof UpdateRowSchema>;

export const MoveRowSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowId: z.uuid(),
  afterRowId: z.uuid().nullable(),
});
export type MoveRowSchema = z.infer<typeof MoveRowSchema>;

export const DeleteRowsSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowIds: z.array(z.uuid()).min(1).max(50),
});
export type DeleteRowsSchema = z.infer<typeof DeleteRowsSchema>;

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

export const DeleteColumnsSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  columnIds: z.array(z.uuid()).min(1).max(50),
});
export type DeleteColumnsSchema = z.infer<typeof DeleteColumnsSchema>;

export const UpdateCellSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  rowId: z.uuid(),
  columnId: z.uuid(),
  value: z.union([z.string(), RichTextSchema]).nullable(),
});
export type UpdateCellSchema = z.infer<typeof UpdateCellSchema>;
