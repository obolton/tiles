import { z } from "zod";
import { ChartSeriesType } from "@/generated/prisma/enums";
import { PositionSchema } from "@/schema/Position.ts";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CreateChartSchema = z.strictObject({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  ...PositionSchema.shape,
  tableId: z.uuid(),
  labelColumnId: z.uuid().optional(),
  background: BackgroundSchema.optional(),
  series: z.array(z.uuid()).max(10).optional(),
});
export type CreateChartSchema = z.infer<typeof CreateChartSchema>;

export const UpdateChartSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  labelColumnId: z.uuid().optional(),
  background: BackgroundSchema.optional(),
});
export type UpdateChartSchema = z.infer<typeof UpdateChartSchema>;

export const AddSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  columnId: z.uuid(),
  type: z.enum(ChartSeriesType).optional(),
});
export type AddSeriesSchema = z.infer<typeof AddSeriesSchema>;

export const UpdateSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  seriesId: z.uuid(),
  type: z.enum(ChartSeriesType),
});
export type UpdateSeriesSchema = z.infer<typeof UpdateSeriesSchema>;

export const DeleteSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  seriesId: z.uuid(),
});
export type DeleteSeriesSchema = z.infer<typeof DeleteSeriesSchema>;
