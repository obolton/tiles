import { z } from "zod";
import { ChartType } from "@/generated/prisma/client";
import { PositionSchema } from "@/schema/Position.ts";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CreateChartSchema = z.strictObject({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  ...PositionSchema.shape,
  chartType: z.enum(ChartType),
  background: BackgroundSchema.optional(),
  series: z
    .array(
      z.strictObject({
        tableId: z.uuid(),
        columnId: z.uuid(),
        title: z.string().optional(),
      }),
    )
    .max(10)
    .optional(),
});
export type CreateChartSchema = z.infer<typeof CreateChartSchema>;

export const UpdateChartSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  chartType: z.enum(ChartType).optional(),
  background: BackgroundSchema.optional(),
});
export type UpdateChartSchema = z.infer<typeof UpdateChartSchema>;

export const AddSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  tableId: z.uuid(),
  columnId: z.uuid(),
  title: z.string().optional(),
});
export type AddSeriesSchema = z.infer<typeof AddSeriesSchema>;

export const UpdateSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  seriesId: z.uuid(),
  title: z.string().optional(),
});
export type UpdateSeriesSchema = z.infer<typeof UpdateSeriesSchema>;

export const DeleteSeriesSchema = z.strictObject({
  pageId: z.uuid(),
  chartId: z.uuid(),
  seriesId: z.uuid(),
});
export type DeleteSeriesSchema = z.infer<typeof DeleteSeriesSchema>;
