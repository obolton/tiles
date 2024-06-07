import prisma from "../database/prisma.ts";
import type { Page } from "@prisma/client";
import type { ClientTile } from "../types/tiles.ts";

export async function getPage(
  id: string
): Promise<{ id: string; title: string; tiles: ClientTile[] }> {
  const page = await prisma.page.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      tiles: {
        select: {
          id: true,
          type: true,
          position: true,
          image: {
            select: {
              id: true,
              imageKey: true,
            },
          },
          text: {
            select: {
              id: true,
              content: true,
            },
          },
          place: {
            select: {
              id: true,
              name: true,
              thumbnailKey: true,
              providerId: true,
              lat: true,
              long: true,
              boundingBox: true,
              address: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  const formatTile = ({
    id,
    type,
    position,
    ...tile
  }: (typeof page.tiles)[0]) => {
    const base = { id, position };
    switch (type) {
      case "IMAGE":
        return {
          ...base,
          type,
          image: tile.image!,
        };
      case "TEXT":
        return {
          ...base,
          type,
          text: tile.text!,
        };
      case "PLACE":
        return {
          ...base,
          type,
          place: tile.place!,
        };
    }
  };

  return {
    id: page.id,
    title: page.title,
    tiles: page.tiles.map(formatTile),
  };
}

export async function createPage({
  authorId,
  title,
}: Pick<Page, "authorId" | "title">) {
  return prisma.page.create({
    data: {
      authorId,
      title,
    },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function updatePage(id: string, { title }: Pick<Page, "title">) {
  return prisma.page.update({
    where: { id },
    data: { title },
    select: {
      id: true,
      title: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
