import type { Layout } from "api/types/tiles";
import type { Operation } from "./base";

export interface SectionCreateData {
  tileId: string;
  sectionId: string | null;
  layout: Layout;
}

export interface SectionCreateInverse {
  tileId: string;
}

export interface SectionCreateOperation extends Operation<
  "section.create",
  SectionCreateData,
  SectionCreateInverse
> {}

export interface SectionUpdateLayoutData {
  sectionId: string;
  layout: Layout;
}

export interface SectionUpdateLayoutOperation extends Operation<
  "section.updateLayout",
  SectionUpdateLayoutData
> {}

export type SectionOperation =
  | SectionCreateOperation
  | SectionUpdateLayoutOperation;
