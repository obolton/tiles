import type { ClientPlace, MapStyle } from "api/types/tiles";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

// Add places to map
export interface AddPlacesData extends TileActionData {
  places: ClientPlace[];
}

export interface AddPlacesAction extends Action<
  "map.addPlaces",
  AddPlacesData
> {}

// Remove places by ID
export interface RemovePlacesData extends TileActionData {
  placeIds: string[];
}

export interface RemovePlacesAction extends Action<
  "map.removePlaces",
  RemovePlacesData
> {}

// Restore a place from snapshot (reverse of remove)
export interface RestorePlaceData extends TileActionData {
  place: ClientPlace;
}

export interface RestorePlaceAction extends Action<
  "map.restorePlace",
  RestorePlaceData
> {}

// Set place properties - symmetric
export interface SetPlacePropertiesData extends TileActionData {
  placeId: string;
  changes: Partial<Omit<ClientPlace, "id">>;
}

export interface SetPlacePropertiesAction extends Action<
  "map.setPlaceProperties",
  SetPlacePropertiesData
> {}

// Set map style
export interface SetMapStyleData extends TileActionData {
  style: MapStyle;
}

export interface SetMapStyleAction extends Action<
  "map.setStyle",
  SetMapStyleData
> {}

export type MapAction =
  | AddPlacesAction
  | RemovePlacesAction
  | RestorePlaceAction
  | SetPlacePropertiesAction
  | SetMapStyleAction;
