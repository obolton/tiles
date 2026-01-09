import { z } from "zod";
import { ChartSeriesType } from "@/generated/prisma/enums";
import { CreateTileSchema } from "@/schema/Tile";
import { BackgroundSchema } from "@/schema/Background.ts";

const ChartSeriesSchema = z.strictObject({
  type: z.enum(ChartSeriesType).optional(),
  fill: BackgroundSchema.nullable().optional(),
});

export const CreateChartSchema = z.strictObject({
  ...CreateTileSchema.shape,
  tableId: z.uuid(),
  labelColumnId: z.uuid().optional(),
  series: z
    .array(ChartSeriesSchema.extend({ columnId: z.uuid() }))
    .max(10)
    .optional(),
});
export type CreateChartSchema = z.infer<typeof CreateChartSchema>;

export const UpdateChartSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  labelColumnId: z.uuid().optional(),
});
export type UpdateChartSchema = z.infer<typeof UpdateChartSchema>;

export const AddSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  columnId: z.uuid(),
  ...ChartSeriesSchema.shape,
});
export type AddSeriesSchema = z.infer<typeof AddSeriesSchema>;

export const UpdateSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  seriesId: z.uuid(),
  ...ChartSeriesSchema.shape,
});
export type UpdateSeriesSchema = z.infer<typeof UpdateSeriesSchema>;

export const DeleteSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  seriesId: z.uuid(),
});
export type DeleteSeriesSchema = z.infer<typeof DeleteSeriesSchema>;
