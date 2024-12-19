import { randomUUID } from "crypto";
import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import { createSignedUploadUrl } from "@/utils/storage.ts";
import { MediaTypeSchema } from "./schema.ts";

export default router({
  createSignedUploadUrl: authenticatedProcedure
    .input(MediaTypeSchema)
    .mutation(async ({ input }) => {
      const key = randomUUID();
      const url = await createSignedUploadUrl(key, input);
      return { key, url };
    }),
});
