import { router } from "@/utils/trpc";
import { authenticatedWorkspaceProcedure } from "@/utils/middleware";
import { CreateImageSchema, UpdateImageSchema, DeleteImageSchema } from "./schema";
import { createImage, updateImage, deleteImage } from "./media";

export default router({
  // TODO: Restrict access to services
  createImage: authenticatedWorkspaceProcedure
    .input(CreateImageSchema)
    .mutation(({ input, ctx }) => createImage(input, ctx)),

  // TODO: Restrict access to services
  updateImage: authenticatedWorkspaceProcedure
    .input(UpdateImageSchema)
    .mutation(({ input, ctx }) => updateImage(input, ctx)),

  // TODO: Restrict access to services
  deleteImage: authenticatedWorkspaceProcedure
    .input(DeleteImageSchema)
    .mutation(({ input, ctx }) => deleteImage(input, ctx)),
});
