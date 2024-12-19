import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createVideo, updateVideo } from "./videos.ts";
import { CreateVideoSchema, UpdateVideoSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateVideoSchema)
    .mutation(({ input }) => createVideo(input)),

  update: pageUpdateProcedure
    .input(UpdateVideoSchema)
    .mutation(({ input }) => updateVideo(input)),
});
