import { router, authenticatedProcedure } from "@/utils/trpc.ts";
import { createImage, updateImage } from "./images.ts";
import { CreateImageSchema, UpdateImageSchema } from "./schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateImageSchema)
    .mutation(async ({ input }) => {
      const image = await createImage(input);
      invalidateCachedPage(input.pageId);
      return image;
    }),

  update: authenticatedProcedure
    .input(UpdateImageSchema)
    .mutation(async ({ input }) => {
      const image = updateImage(input);
      // invalidateCachedPage(input.pageId); TODO
      return image;
    }),
});
