import { router } from "@/utils/trpc.ts";
import { authenticatedWorkspaceProcedure } from "@/utils/middleware.ts";
import {
  CreateUploadURLSchema,
  CreateImageSchema,
  UpdateImageSchema,
  DeleteImageSchema,
} from "./schema.ts";
import {
  createUploadUrl,
  createImage,
  updateImage,
  deleteImage,
} from "./media.ts";

export default router({
  createUploadUrl: authenticatedWorkspaceProcedure
    .input(CreateUploadURLSchema)
    .mutation(({ input, ctx }) => createUploadUrl(input, ctx)),

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
