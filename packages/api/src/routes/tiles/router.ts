import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { duplicateTile, deleteTiles } from "./tiles";
import { DuplicateTileSchema, DeleteTilesSchema } from "./schema";

export default router({
  duplicate: pageUpdateProcedure
    .input(DuplicateTileSchema)
    .mutation(({ input }) => duplicateTile(input)),

  delete: pageUpdateProcedure
    .input(DeleteTilesSchema)
    .mutation(({ input }) => deleteTiles(input)),
});
