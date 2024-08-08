import Tile from "./Tile";
import styles from "./VideoTile.module.css";
import type { ClientVideoTile } from "@/types/tiles";

function getEmbedUrl(
  videoType: ClientVideoTile["video"]["videoType"],
  videoId: string,
) {
  switch (videoType) {
    case "YOUTUBE":
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;

    default:
      throw new Error(`Unsupported video type: ${videoType}`);
  }
}

type VideoTileProps = {
  tile: ClientVideoTile;
};

export default function VideoTile({ tile }: VideoTileProps) {
  const {
    video: { videoType, videoId, imageUrl, title, description },
  } = tile;
  const embedUrl = getEmbedUrl(videoType, videoId);

  return (
    <Tile tile={tile} fullWidth>
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
