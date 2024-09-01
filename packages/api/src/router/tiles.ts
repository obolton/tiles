import { TRPCError } from "@trpc/server";
import { router, procedure } from "./trpc.ts";
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
  create: procedure.input(CreateTileSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const tile = await createTile(ctx.user.id, input);
    invalidateCachedPage(input.pageId);
    return tile;
  }),
  update: procedure.input(UpdateTileSchema).mutation(async ({ input }) => {
    const tile = await updateTile(input);
    invalidateCachedPage(tile.pageId);
    return tile;
  }),
  move: procedure.input(MoveTileSchema).mutation(async ({ input }) => {
    const result = await moveTile(input);
    invalidateCachedPage(result.pageId);
    return result;
  }),
  resize: procedure.input(ResizeTileSchema).mutation(async ({ input }) => {
    const result = await resizeTile(input);
    invalidateCachedPage(result.pageId);
    return result;
  }),
  delete: procedure.input(DeleteTileSchema).mutation(async ({ input }) => {
    const result = await deleteTile(input);
    invalidateCachedPage(result.pageId);
    return null;
  }),
});
