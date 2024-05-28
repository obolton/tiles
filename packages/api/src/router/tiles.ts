import { router, procedure } from "./trpc.ts";
import { createOrUpdateTile } from "../models/tiles/tiles.ts";
import { TileSchema } from "../models/tiles/schema.ts";

export default router({
  createOrUpdate: procedure.input(TileSchema).mutation(async ({ input }) => {
    const tile = await createOrUpdateTile(input);
    return tile;
  }),
});
