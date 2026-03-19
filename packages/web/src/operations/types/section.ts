import type { Layout, MapStyle } from "api/types/tiles";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

export interface SetSectionLayoutData extends TileActionData {
  layout: Layout;
}

export interface SetSectionLayoutAction extends Action<
  "section.setLayout",
  SetSectionLayoutData
> {}

export interface SetSectionColumnsData extends TileActionData {
  columns: number | null;
}

export interface SetSectionColumnsAction extends Action<
  "section.setColumns",
  SetSectionColumnsData
> {}

export interface SetSectionMapStyleData {
  sectionId: string;
  mapStyle: MapStyle | null;
}

export interface SetSectionMapStyleAction extends Action<
  "section.setMapStyle",
  SetSectionMapStyleData
> {}

export type SectionAction =
  | SetSectionLayoutAction
  | SetSectionMapStyleAction
  | SetSectionColumnsAction;
