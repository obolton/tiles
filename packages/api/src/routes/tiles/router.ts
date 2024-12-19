import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { moveTile, resizeTile, deleteTile } from "./tiles.ts";
import {
  MoveTileSchema,
  ResizeTileSchema,
  DeleteTileSchema,
} from "./schema.ts";

export default router({
  move: pageUpdateProcedure
    .input(MoveTileSchema)
    .mutation(({ input }) => moveTile(input)),

  resize: pageUpdateProcedure
    .input(ResizeTileSchema)
    .mutation(({ input }) => resizeTile(input)),

  delete: pageUpdateProcedure
    .input(DeleteTileSchema)
    .mutation(({ input }) => deleteTile(input)),
});
