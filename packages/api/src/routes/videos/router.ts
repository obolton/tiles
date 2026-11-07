import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { resolveVideoMetadata } from "./videos";
import { GetVideoMetadataSchema } from "./schema";

export default router({
  getMetadata: pageUpdateProcedure
    .input(GetVideoMetadataSchema)
    .query(({ input }) => resolveVideoMetadata(input)),
});
