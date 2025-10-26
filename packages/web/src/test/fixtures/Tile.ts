import type {
  ClientTile,
  ClientTextTile,
  ClientImageTile,
  ClientLinkTile,
  ClientMapTile,
  ClientPageLinkTile,
} from "api/types/tiles";

const SHARED = {
  sectionId: "section-id",
  order: "a1",
  x: 5,
  y: 7,
  anchor: "LEFT",
  dimensions: "CUSTOM",
  width: 11,
  height: 13,
  rowSpan: 2,
  block: false,
  animation: "FADE",
  hide: false,
} as const;

export const TILE: ClientTile = {
  ...SHARED,
  id: "tile-id",
  type: "TEXT",
  align: "TOP",
  textColor: null,
  background: null,
  content: [],
};

export const TEXT_TILE: ClientTextTile = {
  ...SHARED,
  id: "tile-id",
  type: "TEXT",
  align: "TOP",
  textColor: null,
  background: null,
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
    author: {
      id: "author-id",
      name: "Linked Author",
      imageUrl: "https://tiles.dev/author.png",
    },
  },
};

export const MAP_TILE = {
  ...SHARED,
  id: "tile-id",
  type: "MAP",
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
