import prisma from "../../database/prisma.ts";
import type {
  GetPageByIdSchema,
  CreatePageSchema,
  UpdatePageSchema,
} from "./schema.ts";
import type { ClientTile } from "../../types/tiles.ts";

export async function getPageById({ id }: GetPageByIdSchema): Promise<{
  id: string;
  title: string;
  subtitle: string | null;
  tiles: ClientTile[];
} | null> {
  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      subtitle: true,
      tiles: {
        select: {
          id: true,
          type: true,
          position: true,
          columns: true,
          rows: true,
          image: {
            select: {
              id: true,
              imageKey: true,
              caption: true,
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
          link: {
            select: {
              id: true,
              url: true,
              title: true,
              description: true,
              siteName: true,
              imageUrl: true,
            },
          },
          heading: {
            select: {
              id: true,
              content: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!page) {
    return null;
  }

  const formatTile = ({
    id,
    type,
    position,
    rows,
    columns,
    ...tile
  }: (typeof page.tiles)[0]) => {
    const base = { id, position, rows, columns };
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
      case "LINK":
        return {
          ...base,
          type,
          link: tile.link!,
        };
      case "HEADING":
        return {
          ...base,
          type,
          heading: tile.heading!,
        };
    }
  };

  return {
    id: page.id,
    title: page.title,
    subtitle: page.subtitle,
    tiles: page.tiles.map(formatTile),
  };
}

export async function createPage(
  authorId: string,
  { title }: CreatePageSchema,
) {
  return prisma.page.create({
    data: {
      authorId,
      title,
    },
    select: {
      id: true,
    },
  });
}

export async function updatePage({ id, title, subtitle }: UpdatePageSchema) {
  return prisma.page.update({
    where: { id },
    data: { title, subtitle },
    select: {
      id: true,
      title: true,
      subtitle: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
