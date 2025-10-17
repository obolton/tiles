import type {
  ClientTile,
  ClientTextTile,
  ClientImageTile,
  ClientLinkTile,
  ClientMapTile,
} from "api/types/tiles";

const SHARED = {
  sectionId: "section-id",
  position: 3,
  x: 5,
  y: 7,
  width: 11,
  height: 13,
  rowSpan: 2,
  block: false,
};

export const TILE: ClientTile = {
  ...SHARED,
  id: "tile-id",
  placementId: "placement-id",
  type: "TEXT",
  align: "TOP",
  textColor: null,
  background: null,
  content: [],
};

export const TEXT_TILE: ClientTextTile = {
  ...SHARED,
  id: "tile-id",
  placementId: "placement-id",
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
  placementId: "placement-id",
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
  placementId: "placement-id",
  type: "LINK",
  url: "https://tiles.dev",
  title: "Link title",
  description: "Link description",
  imageUrl: "https://tiles.dev/image.png",
  siteName: "Test",
};

export const MAP_TILE: ClientMapTile = {
  ...SHARED,
  id: "tile-id",
  placementId: "placement-id",
  type: "MAP",
  places: [
    {
      id: "place-id",
      name: "Test place",
      address: "123 Main St",
      boundingBox: null,
      lat: 0,
      long: 0,
      providerId: "test",
    },
  ],
};
