import Tile, { type TileProps } from "./Tile";
import styles from "./VideoTile.module.css";
import type { ClientVideo } from "@/types/tiles";

function getEmbedUrl(videoType: ClientVideo["videoType"], videoId: string) {
  switch (videoType) {
    case "YOUTUBE":
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;

    default:
      throw new Error(`Unsupported video type: ${videoType}`);
  }
}

interface VideoTileProps extends TileProps {
  video: ClientVideo;
}

export default function VideoTile({ id, video, ...props }: VideoTileProps) {
  const { videoType, videoId, imageUrl, title, description } = video;
  const embedUrl = getEmbedUrl(videoType, videoId);

  return (
    <Tile id={id} {...props} fullWidth>
      <figure className={styles.figure}>
        <embedded-video
          class={styles.video}
          src={embedUrl}
          imagesrc={imageUrl ?? undefined}
        />
        <figcaption>
          <h3 className={styles.title}>{title}</h3>
          {description && <p>{description}</p>}
        </figcaption>
      </figure>
    </Tile>
  );
}
