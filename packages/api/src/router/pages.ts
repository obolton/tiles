import { router, procedure } from "./trpc.ts";
import { GetPageByIdSchema, UpdatePageSchema } from "../models/pages/schema.ts";
import { getPage, updatePage } from "../models/pages/pages.ts";

export default router({
  getById: procedure.input(GetPageByIdSchema).query(async ({ input }) => {
    const page = await getPage(input);
    return page;
  }),

  update: procedure.input(UpdatePageSchema).mutation(async ({ input }) => {
    const page = await updatePage(input);
    return page;
  }),
});
