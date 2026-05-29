import type { Action } from "./base";
import type { TileActionData } from "./tile";

export interface SetLinkPropertiesData extends TileActionData {
  changes: {
    url?: string;
    title?: string | null;
    description?: string | null;
    siteName?: string | null;
    imageId?: string | null;
  };
}

export interface SetLinkPropertiesAction extends Action<
  "link.setProperties",
  SetLinkPropertiesData
> {}

export type LinkAction = SetLinkPropertiesAction;
