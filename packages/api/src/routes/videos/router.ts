import { router, authenticatedProcedure } from "@/router/trpc.ts";
import { createVideo, updateVideo } from "./videos.ts";
import { CreateVideoSchema, UpdateVideoSchema } from "./schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateVideoSchema)
    .mutation(async ({ input }) => {
      const video = await createVideo(input);
      invalidateCachedPage(input.pageId);
      return video;
    }),

  update: authenticatedProcedure
    .input(UpdateVideoSchema)
    .mutation(async ({ input }) => {
      const video = updateVideo(input);
      // invalidateCachedPage(input.pageId); TODO
      return video;
    }),
});
