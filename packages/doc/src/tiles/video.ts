import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput, type PlacementInput } from "./base";
import type { VideoType } from "../types/enums";

export interface VideoMapInput extends Omit<CreateTileInput, "type"> {
  videoType: VideoType;
  videoId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export function buildVideoMap(
  properties: Omit<VideoMapInput, keyof PlacementInput>,
): Y.Map<unknown> {
  const { videoType, videoId, title, description, imageUrl, ...baseProps } = properties;
  const map = buildBaseTileMap({
    ...baseProps,
    type: "VIDEO",
    // Override default AUTO sizing, which has no intrinsic height for an embed
    sizing: baseProps.sizing ?? "LANDSCAPE",
  });
  map.set("videoType", videoType);
  map.set("videoId", videoId);
  map.set("title", title);
  map.set("description", description);
  map.set("imageUrl", imageUrl);
  return map;
}

/** The public page of a video on its provider. */
export function getVideoUrl(videoType: VideoType, videoId: string): string {
  switch (videoType) {
    case "YOUTUBE":
      return `https://www.youtube.com/watch?v=${videoId}`;
    case "VIMEO":
      return `https://vimeo.com/${videoId}`;
  }
}
