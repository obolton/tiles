import type {
  ClientTile,
  ClientTextTile,
  ClientImageTile,
  ClientLinkTile,
  ClientMapTile,
  ClientPageLinkTile,
  ClientVideoTile,
  ClientChartTile,
  ClientTableTile,
  ClientSectionTile,
} from "api/types/tiles";

const SHARED = {
  sectionId: "section-id",
  theme: null,
  order: "a1",
  x: 5,
  y: 7,
  sizing: "CUSTOM",
  width: 11,
  height: 13,
  rowSpan: 2,
  startDate: null,
  endDate: null,
  animation: "FADE",
  frame: null,
  cornerRadius: null,
  hide: false,
  dock: null,
  textColor: null,
  background: null,
} as const;

export const TILE: ClientTile = {
  ...SHARED,
  id: "tile-id",
  type: "TEXT",
  align: "TOP",
  content: [],
};

export const TEXT_TILE: ClientTextTile = {
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

export const IMAGE_TILE: ClientImageTile = {
  ...SHARED,
  id: "tile-id",
  type: "IMAGE",
  imageUrl: "https://tiles.dev/image.png",
  originX: 0,
  originY: 0,
  theme: null,
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

export const LINK_TILE: ClientLinkTile = {
  ...SHARED,
  id: "tile-id",
  type: "LINK",
  url: "https://tiles.dev",
  title: "Link title",
  description: "Link description",
  imageUrl: "https://tiles.dev/image.png",
  siteName: "Test",
};

export const PAGE_LINK_TILE: ClientPageLinkTile = {
  ...SHARED,
  id: "tile-id",
  type: "PAGE_LINK",
  linkedPage: {
    id: "linked-page-id",
    title: "Linked Page",
    background: null,
    font: "CLASSIC",
    coverImageUrl: "https://tiles.dev/cover.png",
  },
};

export const MAP_TILE = {
  ...SHARED,
  id: "tile-id",
  type: "MAP",
  style: "DEFAULT",
  places: [
    {
      id: "place-1",
      name: "Place 1",
      address: "123 First St",
      boundingBox: [],
      lat: 0,
      long: 0,
      providerId: "test",
    },
    {
      id: "place-2",
      name: "Place 2",
      address: "123 Second St",
      boundingBox: [],
      lat: 1,
      long: 1,
      providerId: "test",
    },
  ] as const,
} satisfies ClientMapTile;

export const VIDEO_TILE: ClientVideoTile = {
  ...SHARED,
  id: "tile-id",
  type: "VIDEO",
  videoType: "YOUTUBE",
  videoId: "abc123",
  imageUrl: "https://tiles.dev/video.png",
  title: "Sample video",
  description: "Video description",
};

export const TABLE_TILE: ClientTableTile = {
  ...SHARED,
  id: "table-id",
  type: "TABLE",
  numRows: 3,
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

export const CHART_TILE: ClientChartTile = {
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

export const SECTION_TILE: ClientSectionTile = {
  ...SHARED,
  sectionId: null,
  id: "section-id",
  type: "SECTION",
  layout: "GRID",
};
