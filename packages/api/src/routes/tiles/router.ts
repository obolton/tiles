import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { reorderTile, resizeTile, deleteTile } from "./tiles.ts";
import {
  ReorderTileSchema,
  ResizeTileSchema,
  DeleteTileSchema,
} from "./schema.ts";

export default router({
  reorder: pageUpdateProcedure
    .input(ReorderTileSchema)
    .mutation(({ input }) => reorderTile(input)),

  resize: pageUpdateProcedure
    .input(ResizeTileSchema)
    .mutation(({ input }) => resizeTile(input)),

  delete: pageUpdateProcedure
    .input(DeleteTileSchema)
    .mutation(({ input }) => deleteTile(input)),
});
