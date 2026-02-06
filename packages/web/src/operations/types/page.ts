import type { AppRouterInputs } from "@/api/client";
import type { Action } from "./base";

export type PagePropertyChanges = Omit<
  AppRouterInputs["pages"]["update"],
  "pageId"
>;

export interface SetPagePropertiesData {
  changes: PagePropertyChanges;
}

export interface SetPagePropertiesAction extends Action<
  "page.setProperties",
  SetPagePropertiesData
> {}

export type PageAction = SetPagePropertiesAction;
