import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createImage, updateImage } from "./images.ts";
import { CreateImageSchema, UpdateImageSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateImageSchema)
    .mutation(({ input }) => createImage(input)),

  update: pageUpdateProcedure
    .input(UpdateImageSchema)
    .mutation(({ input }) => updateImage(input)),
});
