import { router, authenticatedProcedure } from "./trpc.ts";
import { createEvent, updateEvent } from "@/models/events/events.ts";
import {
  CreateEventSchema,
  UpdateEventSchema,
} from "@/models/events/schema.ts";
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
