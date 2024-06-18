import { router, procedure } from "./trpc.ts";
import {
  GetPageByIdSchema,
  CreatePageSchema,
  UpdatePageSchema,
} from "../models/pages/schema.ts";
import { getPageById, createPage, updatePage } from "../models/pages/pages.ts";

export default router({
  getById: procedure.input(GetPageByIdSchema).query(async ({ input }) => {
    const page = await getPageById(input);
    return page;
  }),

  create: procedure.input(CreatePageSchema).mutation(async ({ input }) => {
    const page = await createPage(input);
    return page;
  }),

  update: procedure.input(UpdatePageSchema).mutation(async ({ input }) => {
    const page = await updatePage(input);
    return page;
  }),
});
