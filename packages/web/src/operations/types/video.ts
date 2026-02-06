import type { Action } from "./base";

export interface SetVideoPropertiesData {
  tileId: string;
  changes: {
    title?: string;
  };
}

export interface SetVideoPropertiesAction extends Action<
  "video.setProperties",
  SetVideoPropertiesData
> {}

export type VideoAction = SetVideoPropertiesAction;
