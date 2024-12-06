import { router, authenticatedProcedure } from "@/utils/trpc.ts";
import { createEvent, updateEvent } from "./events.ts";
import { CreateEventSchema, UpdateEventSchema } from "./schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateEventSchema)
    .mutation(async ({ input }) => {
      const event = await createEvent(input);
      invalidateCachedPage(input.pageId);
      return event;
    }),

  update: authenticatedProcedure
    .input(UpdateEventSchema)
    .mutation(async ({ input }) => {
      const event = updateEvent(input);
      // invalidateCachedPage(input.pageId); TODO
      return event;
    }),
});
