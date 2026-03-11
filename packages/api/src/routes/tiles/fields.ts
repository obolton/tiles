import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { THEME_FIELDS } from "@/routes/themes/fields";
import { SECTION_FIELDS } from "@/routes/sections/fields";
import { TEXT_FIELDS } from "@/routes/text/fields";
import { IMAGE_FIELDS } from "@/routes/images/fields";
import { VIDEO_FIELDS } from "@/routes/videos/fields";
import { LINK_FIELDS } from "@/routes/links/fields";
import { PAGE_LINK_FIELDS } from "@/routes/pageLinks/fields";
import { MAP_FIELDS } from "@/routes/maps/fields";
import { TABLE_WITH_DATA_FIELDS } from "@/routes/tables/fields";
import { CHART_FIELDS } from "@/routes/charts/fields";

export const TILE_FIELDS = {
  id: true,
  type: true,
  sectionId: true,
  theme: {
    select: THEME_FIELDS,
  },
  order: true,
  sizing: true,
  width: true,
  height: true,
  x: true,
  y: true,
  rowSpan: true,
  startDate: true,
  endDate: true,
  animation: true,
  frame: true,
  cornerRadius: true,
  hide: true,
  dock: true,
  textColor: true,
  background: true,
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

export const FULL_TILE_FIELDS = {
  ...TILE_FIELDS,
  section: {
    select: SECTION_FIELDS,
  },
  text: {
    select: TEXT_FIELDS,
  },
  image: {
    select: IMAGE_FIELDS,
  },
  video: {
    select: VIDEO_FIELDS,
  },
  link: {
    select: LINK_FIELDS,
  },
  pageLink: {
    select: PAGE_LINK_FIELDS,
  },
  map: {
    select: MAP_FIELDS,
  },
  table: {
    select: TABLE_WITH_DATA_FIELDS,
  },
  chart: {
    select: CHART_FIELDS,
  },
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

export type TileBase = Prisma.Result<
  typeof prisma.tile,
  { select: typeof TILE_FIELDS },
  "findUniqueOrThrow"
>;

export type FullTile = Prisma.Result<
  typeof prisma.tile,
  { select: typeof FULL_TILE_FIELDS },
  "findMany"
>[number];
