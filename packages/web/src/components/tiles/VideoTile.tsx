import Caption from "./Caption";
import Tile from "./Tile";
import VideoIcon from "@/icons/video.svg?jsx";
import styles from "./VideoTile.module.css";
import type Video from "@/items/Video";
import type { VideoProperties } from "@/types/tiles";
import type { ReactiveType } from "@/utils/reactivity";

function getEmbedUrl(
  videoType: ReactiveType<VideoProperties["videoType"]>,
  videoId: string,
) {
  switch (videoType) {
    case "YOUTUBE":
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;

    default:
      throw new Error(`Unsupported video type: ${videoType}`);
  }
}

export interface VideoTileProps {
  video: Video;
}

export default function VideoTile({ video }: VideoTileProps) {
  const {
    id,
    videoType,
    videoId,
    imageUrl,
    title,
    editor: { isEditable },
  } = video;
  const embedUrl = getEmbedUrl(videoType, videoId);

  return (
    <Tile>
      <figure className={styles.figure}>
        <embedded-video
          id={`${id}-video`}
          className={styles.video}
          src={embedUrl}
          imagesrc={imageUrl ?? undefined}
          data-show-in-lightbox="true"
        />
        <Caption
          isEditable={isEditable}
          value={title}
          onChange={(value) => video.setTitle(value)}
          placeholder="Add a caption"
        />
      </figure>
      <VideoIcon className={styles.icon} aria-hidden="true" />
    </Tile>
  );
}
