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

const CreateTextTileSchema = BaseCreateTileSchema.extend({
  type: z.literal("TEXT"),
  content: z.string(),
});

export const CreateTileSchema = z.discriminatedUnion("type", [
  CreateImageTileSchema,
  CreateTextTileSchema,
]);

export async function createTile(properties: z.infer<typeof CreateTileSchema>) {
  switch (properties.type) {
    case "IMAGE":
      return createImageTile(properties);
    case "TEXT":
      return createTextTile(properties);
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

async function createTextTile({
  pageId,
  content,
}: z.infer<typeof CreateTextTileSchema>) {
  return prisma.textTile.create({
    data: {
      tile: {
        create: {
          pageId,
          type: "TEXT",
        },
      },
      content,
    },
    select: {
      tile: {
        select: {
          id: true,
          type: true,
          text: {
            select: {
              content: true,
            },
          },
        },
      },
    },
  });
}
