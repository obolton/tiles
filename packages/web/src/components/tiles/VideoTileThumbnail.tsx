import Tile from "@/components/tiles/Tile";
import VideoIcon from "@/icons/video.svg?jsx";
import styles from "./VideoTileThumbnail.module.css";
import type Video from "@/models/Video";

export interface VideoTileThumbnailProps {
  video: Video;
}

export default function VideoTileThumbnail({ video }: VideoTileThumbnailProps) {
  const { imageUrl, title } = video;

  return (
    <Tile>
      <figure className={styles.figure}>
        {imageUrl ? (
          <img className={styles.image} src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.placeholder} />
        )}
        {title.derive((value) =>
          value ? (
            <figcaption className={styles.caption}>{value}</figcaption>
          ) : null,
        )}
      </figure>
      <VideoIcon className={styles.icon} aria-hidden="true" />
    </Tile>
  );
}
