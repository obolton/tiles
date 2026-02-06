import type { Action } from "./base";

export interface SetLinkPropertiesData {
  tileId: string;
  changes: {
    url?: string;
    title?: string | null;
    description?: string | null;
    siteName?: string | null;
    imageUrl?: string | null;
  };
}

export interface SetLinkPropertiesAction extends Action<
  "link.setProperties",
  SetLinkPropertiesData
> {}

export type LinkAction = SetLinkPropertiesAction;
