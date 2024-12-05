import { router, authenticatedProcedure } from "./trpc.ts";
import { createHeading, updateHeading } from "@/models/headings/headings.ts";
import {
  CreateHeadingSchema,
  UpdateHeadingSchema,
} from "@/models/headings/schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateHeadingSchema)
    .mutation(async ({ input }) => {
      const heading = await createHeading(input);
      invalidateCachedPage(input.pageId);
      return heading;
    }),

  update: authenticatedProcedure
    .input(UpdateHeadingSchema)
    .mutation(async ({ input }) => {
      const heading = updateHeading(input);
      // invalidateCachedPage(input.pageId); TODO
      return heading;
    }),
});
