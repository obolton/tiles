import prisma from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import type { CreateEventSchema, UpdateEventSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";

export const EVENT_FIELDS: Prisma.EventTileSelect = {
  id: true,
  title: true,
  start: true,
  end: true,
  allDay: true,
  timeZone: true,
};

export async function createEvent({
  pageId,
  title,
  start,
  end,
  allDay,
  timeZone,
}: CreateEventSchema) {
  return prisma.$transaction(async (transaction) => {
    const event = await transaction.eventTile.create({
      data: {
        title,
        start,
        end,
        allDay,
        timeZone,
      },
      select: EVENT_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "EVENT",
        eventTileId: event.id,
      },
      transaction,
    );
    return { type: "EVENT", ...event, ...placement };
  });
}

export async function updateEvent({
  id,
  title,
  start,
  end,
  allDay,
  timeZone,
}: UpdateEventSchema) {
  return prisma.eventTile.update({
    where: {
      id,
    },
    data: {
      title,
      start,
      end,
      allDay,
      timeZone,
    },
    select: EVENT_FIELDS,
  });
}
