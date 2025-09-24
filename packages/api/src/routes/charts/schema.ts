import { z } from "zod";
import { ChartType } from "@prisma/client";
import { PositionSchema } from "@/schema/Position.ts";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CreateChartSchema = z.strictObject({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  ...PositionSchema.shape,
  chartType: z.enum(ChartType),
  background: BackgroundSchema.optional(),
});
export type CreateChartSchema = z.infer<typeof CreateChartSchema>;

export const UpdateChartSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  chartType: z.enum(ChartType).optional(),
  background: BackgroundSchema.optional(),
});
export type UpdateChartSchema = z.infer<typeof UpdateChartSchema>;
