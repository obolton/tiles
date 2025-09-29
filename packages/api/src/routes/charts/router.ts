import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createChart,
  updateChart,
  addSeries,
  updateSeries,
  deleteSeries,
} from "./charts.ts";
import {
  CreateChartSchema,
  UpdateChartSchema,
  AddSeriesSchema,
  UpdateSeriesSchema,
  DeleteSeriesSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateChartSchema)
    .mutation(({ input }) => createChart(input)),

  update: pageUpdateProcedure
    .input(UpdateChartSchema)
    .mutation(({ input }) => updateChart(input)),

  addSeries: pageUpdateProcedure
    .input(AddSeriesSchema)
    .mutation(({ input }) => addSeries(input)),

  updateSeries: pageUpdateProcedure
    .input(UpdateSeriesSchema)
    .mutation(({ input }) => updateSeries(input)),

  deleteSeries: pageUpdateProcedure
    .input(DeleteSeriesSchema)
    .mutation(({ input }) => deleteSeries(input)),
});
