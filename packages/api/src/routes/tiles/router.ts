import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { deleteTiles } from "./tiles";
import { DeleteTilesSchema } from "./schema";

export default router({
  delete: pageUpdateProcedure
    .input(DeleteTilesSchema)
    .mutation(({ input }) => deleteTiles(input)),
});
