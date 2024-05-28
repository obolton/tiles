import { randomUUID } from "crypto";
import { router, procedure } from "./trpc.ts";
import { createSignedUploadUrl } from "../utils/storage.ts";

export default router({
  createSignedUploadUrl: procedure.mutation(async () => {
    const key = randomUUID();
    const url = await createSignedUploadUrl(key);
    return { key, url };
  }),
});
