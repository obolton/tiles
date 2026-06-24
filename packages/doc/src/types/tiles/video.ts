import type { TileBase } from "./base";

export const VideoType = {
  YOUTUBE: "YOUTUBE",
} as const;
export type VideoType = (typeof VideoType)[keyof typeof VideoType];

export interface VideoTile extends TileBase {
  type: "VIDEO";
  videoType: VideoType;
  videoId: string;
  imageUrl: string | null;
  title: string;
  description: string | null;
}
