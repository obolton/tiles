import { router, authenticatedProcedure } from "@/router/trpc.ts";
import { moveTile, resizeTile, deleteTile } from "./tiles.ts";
import {
  MoveTileSchema,
  ResizeTileSchema,
  DeleteTileSchema,
} from "./schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  move: authenticatedProcedure
    .input(MoveTileSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await moveTile(input, ctx);
      invalidateCachedPage(result.pageId);
      return result;
    }),

  resize: authenticatedProcedure
    .input(ResizeTileSchema)
    .mutation(async ({ input }) => {
      const result = await resizeTile(input);
      invalidateCachedPage(result.pageId);
      return result;
    }),

  delete: authenticatedProcedure
    .input(DeleteTileSchema)
    .mutation(async ({ input }) => {
      const result = await deleteTile(input);
      invalidateCachedPage(result.pageId);
      return null;
    }),
});
