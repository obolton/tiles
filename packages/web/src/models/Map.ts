import Tile from "./Tile";
import { array, reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type Page from "@/models/Page";
import type { ClientMapTile, ClientPlace, MapStyle } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export default class Map extends Tile {
  readonly type = "MAP";

  readonly places: Reactive<ClientPlace[]>;
  readonly style: Reactive<MapStyle>;

  static async create(
    page: Page,
    data: Omit<AppRouterInputs["maps"]["create"], "pageId">,
  ) {
    const properties = await client.maps.create.mutate({
      pageId: page.id,
      ...data,
    });
    const map = new Map(page, properties);
    const { editor } = map;
    editor.addTile(map, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(page: Page, properties: ClientMapTile) {
    super(page, properties);

    const { places, style } = properties;
    this.places = array(places);
    this.style = reactive(style);
  }

  async addPlaces(places: Omit<ClientPlace, "id">[]) {
    const previousPlaceIds = new Set(this.places.value.map((p) => p.id));

    const result = await client.maps.addPlaces.mutate({
      pageId: this.page.id,
      id: this.id,
      places,
    });
    this.places.value = result.places;

    // Find the newly added places (those not in the previous set)
    const addedPlaces = result.places.filter(
      (p) => !previousPlaceIds.has(p.id),
    );

    this.editor.recordOperation({
      apply: {
        type: "map.addPlaces",
        data: { tileId: this.id, places: addedPlaces },
      },
      reverse: {
        type: "map.removePlaces",
        data: { tileId: this.id, placeIds: addedPlaces.map((p) => p.id) },
      },
    });
  }

  async updatePlace(
    place: Pick<ClientPlace, "id"> & Partial<Omit<ClientPlace, "id">>,
  ) {
    const previousPlace = this.places.value.find((p) => p.id === place.id);

    this.places.value = this.places.value.map((p) =>
      p.id === place.id ? { ...p, ...place } : p,
    );
    const result = await client.maps.updatePlace.mutate({
      pageId: this.page.id,
      id: this.id,
      place,
    });
    this.places.value = result.places;

    if (previousPlace) {
      const { id: placeId, ...changes } = place;
      const { id: _, ...previousChanges } = previousPlace;
      this.editor.recordOperation({
        apply: {
          type: "map.setPlaceProperties",
          data: { tileId: this.id, placeId, changes },
        },
        reverse: {
          type: "map.setPlaceProperties",
          data: { tileId: this.id, placeId, changes: previousChanges },
        },
      });
    }
  }

  async removePlace(placeId: string) {
    const place = this.places.value.find((p) => p.id === placeId);

    this.places.value = this.places.value.filter((p) => p.id !== placeId);
    const result = await client.maps.removePlace.mutate({
      pageId: this.page.id,
      id: this.id,
      placeId,
    });
    this.places.value = result.places;

    if (place) {
      this.editor.recordOperation({
        apply: {
          type: "map.removePlaces",
          data: { tileId: this.id, placeIds: [placeId] },
        },
        reverse: { type: "map.restorePlace", data: { tileId: this.id, place } },
      });
    }
  }

  async updateStyle(style: MapStyle) {
    const previousStyle = this.style.value;

    this.style.value = style;
    const result = await client.maps.update.mutate({
      pageId: this.page.id,
      id: this.id,
      style,
    });
    this.style.value = result.style;

    this.editor.recordOperation({
      apply: { type: "map.setStyle", data: { tileId: this.id, style } },
      reverse: {
        type: "map.setStyle",
        data: { tileId: this.id, style: previousStyle },
      },
    });
  }
}
