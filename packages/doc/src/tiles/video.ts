import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";
import type { VideoType } from "../types/enums";

export interface VideoMapInput extends Omit<CreateTileInput, "type"> {
  videoType: VideoType;
  videoId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export function buildVideoMap(
  properties: Omit<VideoMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const { videoType, videoId, title, description, imageUrl, ...baseProps } =
    properties;
  const map = buildBaseTileMap({ ...baseProps, type: "VIDEO" });
  map.set("videoType", videoType);
  map.set("videoId", videoId);
  map.set("title", title);
  map.set("description", description);
  map.set("imageUrl", imageUrl);
  return map;
}
