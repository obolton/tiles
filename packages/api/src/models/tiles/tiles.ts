import { createOrUpdateImageTile } from "./image.ts";
import { createOrUpdateTextTile } from "./text.ts";
import type { TileSchema } from "./schema.ts";

export async function createOrUpdateTile(properties: TileSchema) {
  switch (properties.type) {
    case "IMAGE":
      return createOrUpdateImageTile(properties);
    case "TEXT":
      return createOrUpdateTextTile(properties);
  }
}
