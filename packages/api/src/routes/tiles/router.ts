import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { reorderTile, updateTile, duplicateTile, deleteTiles } from "./tiles";
import {
  ReorderTileSchema,
  UpdateTileSchema,
  DuplicateTileSchema,
  DeleteTilesSchema,
} from "./schema";

export default router({
  reorder: pageUpdateProcedure
    .input(ReorderTileSchema)
    .mutation(({ input }) => reorderTile(input)),

  update: pageUpdateProcedure
    .input(UpdateTileSchema)
    .mutation(({ input }) => updateTile(input)),

  duplicate: pageUpdateProcedure
    .input(DuplicateTileSchema)
    .mutation(({ input }) => duplicateTile(input)),

  delete: pageUpdateProcedure
    .input(DeleteTilesSchema)
    .mutation(({ input }) => deleteTiles(input)),
});
