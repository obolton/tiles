import Tile from "./Tile";
import { array, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientMapTile, ClientPlace } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export default class Map extends Tile {
  readonly type = "MAP";

  readonly places: Reactive<ClientPlace[]>;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["maps"]["create"], "pageId">,
  ) {
    const properties = await client.maps.create.mutate({
      pageId: editor.pageId,
      ...data,
    });
    const map = new Map(editor, properties);
    editor.addTile(map, properties.sectionId, data.afterId);
  }

  constructor(editor: Editor, properties: ClientMapTile) {
    super(editor, properties);

    const { places } = properties;
    this.places = array(places);
  }

  async addPlaces(places: Omit<ClientPlace, "id">[]) {
    const result = await client.maps.addPlaces.mutate({
      pageId: this.editor.pageId,
      id: this.id,
      places,
    });
    this.places.value = result.places;
  }

  async updatePlace(
    place: Pick<ClientPlace, "id"> & Partial<Omit<ClientPlace, "id">>,
  ) {
    this.places.value = this.places.value.map((p) =>
      p.id === place.id ? { ...p, ...place } : p,
    );
    const result = await client.maps.updatePlace.mutate({
      pageId: this.editor.pageId,
      id: this.id,
      place,
    });
    this.places.value = result.places;
  }

  async removePlace(placeId: string) {
    this.places.value = this.places.value.filter((p) => p.id !== placeId);
    const result = await client.maps.removePlace.mutate({
      pageId: this.editor.pageId,
      id: this.id,
      placeId,
    });
    this.places.value = result.places;
  }
}
