import Caption from "./Caption";
import Tile from "./Tile";
import VideoIcon from "@/icons/video.svg?jsx";
import styles from "./VideoTile.module.css";
import type Video from "@/models/Video";
import type { VideoType } from "@/models/Video";

function getEmbedUrl(videoType: VideoType, videoId: string) {
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
  const embedUrl = getEmbedUrl(videoType.value, videoId.value);

  return (
    <Tile>
      <figure className={styles.figure}>
        <embedded-video
          id={`${id}-video`}
          className={styles.video}
          src={embedUrl}
          imagesrc={imageUrl}
          data-show-in-lightbox="true"
        />
        <Caption
          isEditable={isEditable}
          value={title}
          onChange={(value) => (video.title.value = value)}
          placeholder="Add a caption"
        />
      </figure>
      <VideoIcon className={styles.icon} aria-hidden="true" />
    </Tile>
  );
}
