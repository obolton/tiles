import { router } from "@/utils/trpc.ts";
import { authenticatedWorkspaceProcedure } from "@/utils/middleware.ts";
import {
  CreateUploadURLSchema,
  CreateImageSchema,
  UpdateImageSchema,
} from "./schema.ts";
import { createUploadUrl, createImage, updateImage } from "./media.ts";

export default router({
  createUploadUrl: authenticatedWorkspaceProcedure
    .input(CreateUploadURLSchema)
    .mutation(({ input, ctx }) => createUploadUrl(input, ctx)),

  createImage: authenticatedWorkspaceProcedure
    .input(CreateImageSchema)
    .mutation(({ input, ctx }) => createImage(input, ctx)),

  updateImage: authenticatedWorkspaceProcedure
    .input(UpdateImageSchema)
    .mutation(({ input, ctx }) => updateImage(input, ctx)),
});
