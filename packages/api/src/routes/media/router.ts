import { router } from "@/utils/trpc.ts";
import {
  authenticatedWorkspaceProcedure,
  authenticatedServiceProcedure,
} from "@/utils/middleware.ts";
import { CreateUploadURLSchema, RegisterImageSchema } from "./schema.ts";
import { createUploadUrl, registerImage } from "./media.ts";

export default router({
  createUploadUrl: authenticatedWorkspaceProcedure
    .input(CreateUploadURLSchema)
    .mutation(({ input, ctx }) => createUploadUrl(input, ctx)),

  registerImage: authenticatedServiceProcedure
    .input(RegisterImageSchema)
    .mutation(({ input }) => registerImage(input)),
});
