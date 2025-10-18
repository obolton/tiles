import { z } from "zod";
import { TileSchema } from "@/schema/Tile";
import { RichTextSchema } from "@/schema/RichText.ts";
import { ColorSchema } from "@/schema/Color.ts";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CellRangeSchema = z.strictObject({
  type: z.literal("cells"),
  from: z.strictObject({
    row: z.uuid(),
    column: z.uuid(),
  }),
  to: z.strictObject({
    row: z.uuid(),
    column: z.uuid(),
  }),
});

export const RowRangeSchema = z.strictObject({
  type: z.literal("rows"),
  from: z.uuid(),
  to: z.uuid(),
});

export const ColumnRangeSchema = z.strictObject({
  type: z.literal("columns"),
  from: z.uuid(),
  to: z.uuid(),
});

export const RangeSchema = z.discriminatedUnion("type", [
  CellRangeSchema,
  RowRangeSchema,
  ColumnRangeSchema,
]);

export const CreateTableSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  columns: z.number().int().min(1).max(100),
  rows: z.number().int().max(10),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.optional(),
  ...TileSchema.shape,
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
  title: z.string().nullable().optional(),
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
  title: z.string().nullable().optional(),
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

export const ClearRangesSchema = z.object({
  pageId: z.uuid(),
  tableId: z.uuid(),
  ranges: z.array(RangeSchema).min(1).max(10),
});
export type ClearRangesSchema = z.infer<typeof ClearRangesSchema>;
