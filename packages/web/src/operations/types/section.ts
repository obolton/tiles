import type { Layout, MapStyle } from "api/types/tiles";
import type { Action } from "./base";

export interface SetSectionLayoutData {
  sectionId: string;
  layout: Layout;
}

export interface SetSectionLayoutAction extends Action<
  "section.setLayout",
  SetSectionLayoutData
> {}

export interface SetSectionMapStyleData {
  sectionId: string;
  mapStyle: MapStyle | null;
}

export interface SetSectionMapStyleAction extends Action<
  "section.setMapStyle",
  SetSectionMapStyleData
> {}

export type SectionAction = SetSectionLayoutAction | SetSectionMapStyleAction;
