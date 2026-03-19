import type { Layout } from "api/types/tiles";
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

export type SectionAction = SetSectionLayoutAction | SetSectionColumnsAction;
