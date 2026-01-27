import type { AppRouterInputs } from "@/api/client";
import type { Operation } from "./base";

export type PagePropertyChanges = Omit<
  AppRouterInputs["pages"]["update"],
  "pageId"
>;

export interface PageUpdateData {
  changes: PagePropertyChanges;
}

export interface PageUpdateOperation extends Operation<
  "page.update",
  PageUpdateData
> {}

export type PageOperation = PageUpdateOperation;
