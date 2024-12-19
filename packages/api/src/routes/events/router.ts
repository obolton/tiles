import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createEvent, updateEvent } from "./events.ts";
import { CreateEventSchema, UpdateEventSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateEventSchema)
    .mutation(({ input }) => createEvent(input)),

  update: pageUpdateProcedure
    .input(UpdateEventSchema)
    .mutation(({ input }) => updateEvent(input)),
});
