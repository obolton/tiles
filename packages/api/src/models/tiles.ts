import { z } from "zod";
import prisma from "../database/prisma.ts";

const BaseCreateTileSchema = z.object({
  pageId: z.string(),
  type: z.enum(["IMAGE"]),
});

const CreateImageTileSchema = BaseCreateTileSchema.extend({
  type: z.literal("IMAGE"),
  imageKey: z.string(),
});

export const CreateTileSchema = z.discriminatedUnion("type", [
  CreateImageTileSchema,
]);

export async function createTile(properties: z.infer<typeof CreateTileSchema>) {
  switch (properties.type) {
    case "IMAGE":
      return createImageTile(properties);
    default:
      throw new Error(`Invalid tile type: ${properties.type}`);
  }
}

async function createImageTile({
  pageId,
  imageKey,
}: z.infer<typeof CreateImageTileSchema>) {
  return prisma.imageTile.create({
    data: {
      tile: {
        create: {
          pageId,
          type: "IMAGE",
        },
      },
      imageKey,
    },
    select: {
      tile: {
        select: {
          id: true,
          type: true,
          image: {
            select: {
              imageKey: true,
            },
          },
        },
      },
    },
  });
}
