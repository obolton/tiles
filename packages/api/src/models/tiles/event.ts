import { TileType, type Prisma } from "@prisma/client";
import type { CreateEventTileSchema, UpdateEventTileSchema } from "./schema.ts";

export async function createEventTile(
  tx: Prisma.TransactionClient,
  {
    pageId,
    event: { title, start, end, allDay, timeZone },
  }: CreateEventTileSchema,
  position: number,
) {
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.EVENT,
      position,
      columns: 1,
      rows: 1,
      event: {
        create: {
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
  { id, event: { title, start, end, allDay, timeZone } }: UpdateEventTileSchema,
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
