import type { VideoType } from "./types/enums";

export interface VideoInfo {
  videoType: VideoType;
  videoId: string;
}

const YOUTUBE_ID = /^[\w-]+$/;
const VIMEO_ID = /^\d+$/;

function youtubeVideo(videoId: string | null | undefined): VideoInfo | null {
  return videoId && YOUTUBE_ID.test(videoId) ? { videoType: "YOUTUBE", videoId } : null;
}

/**
 * Identifies the provider and video ID of a supported video URL, or returns
 * `null` for anything else. Supports YouTube and Vimeo page, short and embed
 * links.
 */
export function parseVideoUrl(input: string): VideoInfo | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, "");
  const segments = url.pathname.split("/").filter(Boolean);

  switch (host) {
    case "youtube.com":
    case "youtube-nocookie.com": {
      const [route, videoId] = segments;
      switch (route) {
        case "watch":
          return youtubeVideo(url.searchParams.get("v"));
        case "embed":
        case "shorts":
        case "live":
        case "v":
          return youtubeVideo(videoId);
        default:
          return null;
      }
    }

    case "youtu.be":
      return youtubeVideo(segments[0]);

    case "vimeo.com":
    case "player.vimeo.com": {
      // Video, channel, showcase and player paths all end with the numeric
      // video ID, optionally followed by an unlisted video's hash
      const videoId = segments.findLast((segment) => VIMEO_ID.test(segment));
      return videoId ? { videoType: "VIMEO", videoId } : null;
    }

    default:
      return null;
  }
}
