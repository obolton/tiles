import { randomUUID } from "crypto";
import { router, procedure } from "./trpc.ts";
import { createSignedUploadUrl } from "@/utils/storage.ts";
import { MediaTypeSchema } from "@/schema/Media.ts";

export default router({
  createSignedUploadUrl: procedure
    .input(MediaTypeSchema)
    .mutation(async ({ input }) => {
      const key = randomUUID();
      const url = await createSignedUploadUrl(key, input);
      return { key, url };
    }),
});
