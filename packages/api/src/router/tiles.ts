import { router, procedure } from "./trpc.ts";
import { createTile, CreateTileSchema } from "../models/tiles.ts";

export default router({
  create: procedure.input(CreateTileSchema).mutation(async ({ input }) => {
    const tile = await createTile(input);
    return tile;
  }),
});
