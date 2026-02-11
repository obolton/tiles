import { afterEach, describe, expect, test, vi } from "vitest";
import Map from "@/models/Map";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { MAP_TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({
  default: {
    maps: {
      addPlaces: {
        mutate: vi.fn(),
      },
      updatePlace: {
        mutate: vi.fn(),
      },
      removePlace: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Map", () => {
  const editor = Editor.init(PAGE);
  const addPlacesMock = vi.mocked(client.maps.addPlaces.mutate);
  const updatePlaceMock = vi.mocked(client.maps.updatePlace.mutate);
  const removePlaceMock = vi.mocked(client.maps.removePlace.mutate);

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("maps properties to reactive values", () => {
    const map = new Map(editor.page, MAP_TILE);

    expect(map.type).toBe("MAP");
    expect(map.places.value).toEqual(MAP_TILE.places);
  });

  describe("addPlaces", () => {
    test("updates the list of places", async () => {
      const map = new Map(editor.page, MAP_TILE);
      const place = {
        name: "New place",
        address: "123 New St",
        lat: 0,
        long: 0,
        boundingBox: [],
        providerId: "test",
      };

      const response = {
        ...MAP_TILE,
        places: [...MAP_TILE.places, { ...place, id: "new-place-id" }],
      };
      addPlacesMock.mockResolvedValue(response);

      await map.addPlaces([place]);

      expect(addPlacesMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: MAP_TILE.id,
        places: [place],
      });
      expect(map.places.value).toEqual(response.places);
    });
  });

  describe("updatePlace", () => {
    test("updates the list of places", async () => {
      const map = new Map(editor.page, MAP_TILE);
      const place = {
        id: MAP_TILE.places[0].id,
        name: "Updated name",
      };

      const response = {
        ...MAP_TILE,
        places: [
          {
            ...MAP_TILE.places[0],
            place,
          },
          MAP_TILE.places[1],
        ],
      };
      updatePlaceMock.mockResolvedValue(response);

      await map.updatePlace(place);

      expect(updatePlaceMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: MAP_TILE.id,
        place: place,
      });
      expect(map.places.value).toEqual(response.places);
    });
  });

  describe("removePlaces", () => {
    test("updates the list of places", async () => {
      const map = new Map(editor.page, MAP_TILE);

      const response = {
        ...MAP_TILE,
        places: [MAP_TILE.places[1]],
      };
      removePlaceMock.mockResolvedValue(response);

      await map.removePlace(MAP_TILE.places[0].id);

      expect(removePlaceMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: MAP_TILE.id,
        placeId: MAP_TILE.places[0].id,
      });
      expect(map.places.value).toEqual(response.places);
    });
  });
});
