import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createChart, updateChart } from "./charts.ts";
import { CreateChartSchema, UpdateChartSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateChartSchema)
    .mutation(({ input }) => createChart(input)),

  update: pageUpdateProcedure
    .input(UpdateChartSchema)
    .mutation(({ input }) => updateChart(input)),
});
