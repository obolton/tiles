import { router, procedure } from "./trpc.ts";
import { createTile, updateTile, moveTile } from "../models/tiles/tiles.ts";
import {
  CreateTileSchema,
  UpdateTileSchema,
  MoveTileSchema,
} from "../models/tiles/schema.ts";

export default router({
  create: procedure.input(CreateTileSchema).mutation(async ({ input }) => {
    const tile = await createTile(input);
    return tile;
  }),
  update: procedure.input(UpdateTileSchema).mutation(async ({ input }) => {
    const tile = await updateTile(input);
    return tile;
  }),
  move: procedure.input(MoveTileSchema).mutation(async ({ input }) => {
    const result = await moveTile(input);
    return result;
  }),
});
