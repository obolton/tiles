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

export type SectionAction = SetSectionLayoutAction;
