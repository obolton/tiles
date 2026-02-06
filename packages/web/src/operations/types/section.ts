import type { Layout } from "api/types/tiles";
import type { Action } from "./base";

export interface SetSectionLayoutData {
  sectionId: string;
  layout: Layout;
}

export interface SetSectionLayoutAction extends Action<
  "section.setLayout",
  SetSectionLayoutData
> {}

export type SectionAction = SetSectionLayoutAction;
