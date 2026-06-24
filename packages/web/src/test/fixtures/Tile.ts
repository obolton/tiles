import type {
  Tile,
  TextTile,
  ImageTile,
  LinkTile,
  PageLinkTile,
  VideoTile,
  ChartTile,
  TableTile,
  SectionTile,
} from "doc/types/tiles";

const SHARED = {
  sectionId: "section-id",
  order: "a1",
  x: 5,
  y: 7,
  sizing: "CUSTOM",
  width: 11,
  height: 13,
  rowSpan: 2,
  startDate: null,
  endDate: null,
  lat: null,
  long: null,
  animation: "FADE",
  frame: null,
  cornerRadius: null,
  hide: false,
  dock: null,
  textColor: null,
  background: null,
} as const;

export const TILE: Tile = {
  ...SHARED,
  id: "tile-id",
  type: "TEXT",
  align: "TOP",
  content: [],
};

export const TEXT_TILE: TextTile = {
  ...SHARED,
  id: "tile-id",
  type: "TEXT",
  align: "TOP",
  content: [
    {
      type: "paragraph",
      align: 0,
      children: [
        {
          type: "text",
          text: "Hello world",
          format: 0,
          pending: undefined,
          size: 1,
        },
      ],
    },
  ],
};

export const IMAGE_TILE: ImageTile = {
  ...SHARED,
  id: "tile-id",
  type: "IMAGE",
  imageId: "00000000-0000-0000-0000-000000000001",
  image: { width: 1920, height: 1080 },
  alt: null,
  originX: 0,
  originY: 0,
  text: [
    {
      type: "paragraph",
      align: 0,
      children: [
        {
          type: "text",
          text: "Hello world",
          format: 0,
          pending: undefined,
          size: 1,
        },
      ],
    },
  ],
};

export const LINK_TILE: LinkTile = {
  ...SHARED,
  id: "tile-id",
  type: "LINK",
  url: "https://tiles.dev",
  title: "Link title",
  description: "Link description",
  imageId: "00000000-0000-0000-0000-000000000001",
  siteName: "Test",
};

export const PAGE_LINK_TILE: PageLinkTile = {
  ...SHARED,
  id: "tile-id",
  type: "PAGE_LINK",
  linkedPage: {
    id: "linked-page-id",
    title: "Linked Page",
    background: null,
    font: "lora",
  },
};

export const VIDEO_TILE: VideoTile = {
  ...SHARED,
  id: "tile-id",
  type: "VIDEO",
  videoType: "YOUTUBE",
  videoId: "abc123",
  imageUrl: "https://tiles.dev/video.png",
  title: "Sample video",
  description: "Video description",
};

export const TABLE_TILE: TableTile = {
  ...SHARED,
  id: "table-id",
  type: "TABLE",
  columns: [
    { id: "col-1", title: "Revenue", width: 100, background: null },
    { id: "col-2", title: "Expenses", width: 100, background: null },
    { id: "col-3", title: "Profit", width: 100, background: null },
    { id: "col-4", title: null, width: 100, background: null },
  ],
  rows: [
    { id: "row-1", height: 40, data: {}, background: null },
    { id: "row-2", height: 40, data: {}, background: null },
    { id: "row-3", height: 40, data: {}, background: null },
  ],
};

export const CHART_TILE: ChartTile = {
  ...SHARED,
  id: "chart-id",
  type: "CHART",
  tableId: "table-id",
  label: { id: "col-1", title: "Revenue" },
  series: [
    {
      id: "series-1",
      type: "BAR",
      fill: { type: "color", color: "ffff40400000" },
      column: { id: "col-2", title: "Expenses" },
    },
    {
      id: "series-2",
      type: "LINE",
      fill: { type: "color", color: "ffff40404040" },
      column: { id: "col-3", title: "Profit" },
    },
  ],
};

export const SECTION_TILE: SectionTile = {
  ...SHARED,
  sectionId: null,
  id: "section-id",
  type: "SECTION",
  layout: "GRID",
  mapStyle: null,
  columns: null,
};
