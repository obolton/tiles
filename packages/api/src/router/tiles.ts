import { router, authenticatedProcedure } from "./trpc.ts";
import {
  createTile,
  updateTile,
  moveTile,
  resizeTile,
  deleteTile,
} from "@/models/tiles/tiles.ts";
import {
  CreateTileSchema,
  UpdateTileSchema,
  MoveTileSchema,
  ResizeTileSchema,
  DeleteTileSchema,
} from "@/models/tiles/schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateTileSchema)
    .mutation(async ({ ctx, input }) => {
      const tile = await createTile(input, ctx);
      invalidateCachedPage(input.pageId);
      return tile;
    }),

  update: authenticatedProcedure
    .input(UpdateTileSchema)
    .mutation(async ({ input }) => {
      const tile = await updateTile(input);
      invalidateCachedPage(tile.pageId);
      return tile;
    }),

  move: authenticatedProcedure
    .input(MoveTileSchema)
    .mutation(async ({ input }) => {
      const result = await moveTile(input);
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
