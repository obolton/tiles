import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { updateTile, duplicateTile, deleteTiles } from "./tiles";
import {
  UpdateTileSchema,
  DuplicateTileSchema,
  DeleteTilesSchema,
} from "./schema";

export default router({
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
