import { z } from "zod";
import { router, procedure } from "./trpc.js";
import { getPage, updatePage } from "../models/pages.js";

export default router({
  getById: procedure.input(z.string()).query(async ({ input }) => {
    const page = await getPage(input);
    return page;
  }),

  update: procedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ input }) => {
      const { id, title } = input;
      const page = await updatePage(id, { title });
      return page;
    }),
});
