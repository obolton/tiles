import prisma from "../database/prisma.ts";
import type { Page } from "@prisma/client";
import type { Tile } from "../types/tiles.ts";

export async function getPage(
  id: string
): Promise<{ id: string; title: string; tiles: Tile[] }> {
  const page = await prisma.page.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      tiles: {
        select: {
          id: true,
          type: true,
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
        },
      },
    },
  });
  return {
    id: page.id,
    title: page.title,
    tiles: page.tiles as Tile[],
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
