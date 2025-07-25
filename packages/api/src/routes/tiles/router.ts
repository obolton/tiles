import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { reorderTile, updateTile, deleteTile } from "./tiles.ts";
import {
  ReorderTileSchema,
  UpdateTileSchema,
  DeleteTileSchema,
} from "./schema.ts";

export default router({
  reorder: pageUpdateProcedure
    .input(ReorderTileSchema)
    .mutation(({ input }) => reorderTile(input)),

  update: pageUpdateProcedure
    .input(UpdateTileSchema)
    .mutation(({ input }) => updateTile(input)),

  delete: pageUpdateProcedure
    .input(DeleteTileSchema)
    .mutation(({ input }) => deleteTile(input)),
});
