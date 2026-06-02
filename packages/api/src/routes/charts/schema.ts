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
