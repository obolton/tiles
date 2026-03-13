import type { Action } from "./base";
import type { TileActionData } from "./tile";

export interface SetVideoPropertiesData extends TileActionData {
  changes: {
    title?: string;
  };
}

export interface SetVideoPropertiesAction extends Action<
  "video.setProperties",
  SetVideoPropertiesData
> {}

export type VideoAction = SetVideoPropertiesAction;
