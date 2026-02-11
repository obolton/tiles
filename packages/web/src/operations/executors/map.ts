import Map from "@/models/Map";
import type {
  AddPlacesAction,
  RemovePlacesAction,
  RestorePlaceAction,
  SetPlacePropertiesAction,
  SetMapStyleAction,
} from "../types";
import type { ActionExecutor } from "./types";

const addPlaces: ActionExecutor<AddPlacesAction> = async (
  editor,
  { tileId, places },
) => {
  const map = editor.page.getTile(tileId, Map);
  map.places.value = [...map.places.value, ...places];
};

const removePlaces: ActionExecutor<RemovePlacesAction> = async (
  editor,
  { tileId, placeIds },
) => {
  const map = editor.page.getTile(tileId, Map);
  map.places.value = map.places.value.filter((p) => !placeIds.includes(p.id));
};

const restorePlace: ActionExecutor<RestorePlaceAction> = async (
  editor,
  { tileId, place },
) => {
  const map = editor.page.getTile(tileId, Map);
  map.places.value = [...map.places.value, place];
};

const setPlaceProperties: ActionExecutor<SetPlacePropertiesAction> = async (
  editor,
  { tileId, placeId, changes },
) => {
  const map = editor.page.getTile(tileId, Map);
  map.places.value = map.places.value.map((p) =>
    p.id === placeId ? { ...p, ...changes } : p,
  );
};

const setStyle: ActionExecutor<SetMapStyleAction> = async (
  editor,
  { tileId, style },
) => {
  const map = editor.page.getTile(tileId, Map);
  map.style.value = style;
};

export const executors = {
  "map.addPlaces": addPlaces,
  "map.removePlaces": removePlaces,
  "map.restorePlace": restorePlace,
  "map.setPlaceProperties": setPlaceProperties,
  "map.setStyle": setStyle,
} as const;
