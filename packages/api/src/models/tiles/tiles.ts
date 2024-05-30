import prisma from "../../database/prisma.ts";
import { createImageTile, updateImageTile } from "./image.ts";
import { createTextTile, updateTextTile } from "./text.ts";
import type {
  CreateTileSchema,
  UpdateTileSchema,
} from "./schema.ts";

export async function createTile(properties: CreateTileSchema) {
  return prisma.$transaction(async (tx) => {
    const position = await tx.tile.count({
      where: { pageId: properties.pageId },
    });
    switch (properties.type) {
      case "IMAGE":
        return createImageTile(tx, properties, position);
      case "TEXT":
        return createTextTile(tx, properties, position);
    }
  });
}

export async function updateTile(properties: UpdateTileSchema) {
  switch (properties.type) {
    case "IMAGE":
      return updateImageTile(prisma, properties);
    case "TEXT":
      return updateTextTile(prisma, properties);
  }
}
