import type { VideoType } from "doc/types/enums";

export type Video = {
  videoType: VideoType;
  videoId: string;
};

export function getVideoInfo(videoUrl: string): Video | null {
  const url = new URL(videoUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  switch (url.hostname) {
    case "www.youtube.com":
    case "youtube.com": {
      if (url.pathname !== "/watch") {
        return null;
      }
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return { videoType: "YOUTUBE", videoId };
      }
      return null;
    }

    default:
      return null;
  }
}
