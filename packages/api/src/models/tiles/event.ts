import { TileType, type Prisma } from "@prisma/client";
import type { EventTileSchema } from "./schema.ts";

export async function createEventTile(
  tx: Prisma.TransactionClient,
  pageId: string,
  { event: { title, start, end, allDay, timeZone } }: EventTileSchema,
  position: number,
) {
  const eventTile = await tx.eventTile.create({
    data: {
      title,
      start,
      end,
      allDay,
      timeZone,
    },
    select: {
      id: true,
    },
  });
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.EVENT,
      position,
      columns: 1,
      rows: 1,
      eventTileId: eventTile.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      event: {
        select: {
          title: true,
          start: true,
          end: true,
          allDay: true,
          timeZone: true,
        },
      },
    },
  });
}

export async function updateEventTile(
  tx: Prisma.TransactionClient,
  id: string,
  { event: { title, start, end, allDay, timeZone } }: EventTileSchema,
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      event: {
        update: {
          title,
          start,
          end,
          allDay,
          timeZone,
        },
      },
    },
    select: {
      id: true,
      pageId: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      event: {
        select: {
          title: true,
          start: true,
          end: true,
          allDay: true,
          timeZone: true,
        },
      },
    },
  });
}
