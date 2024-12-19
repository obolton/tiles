import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createText, updateText } from "./text.ts";
import { CreateTextSchema, UpdateTextSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateTextSchema)
    .mutation(({ input }) => createText(input)),

  update: pageUpdateProcedure
    .input(UpdateTextSchema)
    .mutation(({ input }) => updateText(input)),
});
