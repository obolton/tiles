import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { reorderTile, updateTile, deleteTiles } from "./tiles.ts";
import {
  ReorderTileSchema,
  UpdateTileSchema,
  DeleteTilesSchema,
} from "./schema.ts";

export default router({
  reorder: pageUpdateProcedure
    .input(ReorderTileSchema)
    .mutation(({ input }) => reorderTile(input)),

  update: pageUpdateProcedure
    .input(UpdateTileSchema)
    .mutation(({ input }) => updateTile(input)),

  delete: pageUpdateProcedure
    .input(DeleteTilesSchema)
    .mutation(({ input }) => deleteTiles(input)),
});
