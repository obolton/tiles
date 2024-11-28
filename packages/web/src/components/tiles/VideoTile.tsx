import useEditable from "@/hooks/useEditable";
import type { ClientVideo } from "@/types/tiles";
import { updateTile } from "@/utils/edit";
import { useCallback } from "react";
import Caption from "./Caption";
import Tile, { type TileProps } from "./Tile";
import styles from "./VideoTile.module.css";

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
  const { videoType, videoId, imageUrl, title } = video;
  const isEditable = useEditable();
  const embedUrl = getEmbedUrl(videoType, videoId);

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await updateTile(id, {
        type: "VIDEO",
        video: { title: value },
      });
    },
    [id],
  );

  return (
    <Tile id={id} {...props}>
      <figure className={styles.figure}>
        <embedded-video
          id={`${id}-video`}
          class={styles.video}
          src={embedUrl}
          imagesrc={imageUrl ?? undefined}
          data-show-in-lightbox="true"
        />
        <Caption
          isEditable={isEditable}
          value={title}
          onChange={onUpdateCaption}
          placeholder="Add a caption"
        />
      </figure>
    </Tile>
  );
}
