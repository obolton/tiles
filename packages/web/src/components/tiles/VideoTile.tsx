import useEditable from "@/hooks/useEditable";
import type { ClientVideo } from "@/types/tiles";
import { updateVideo } from "@/utils/edit";
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

interface VideoTileProps extends TileProps, ClientVideo {}

export default function VideoTile({
  id,
  videoType,
  videoId,
  imageUrl,
  title,
  ...props
}: VideoTileProps) {
  const isEditable = useEditable();
  const embedUrl = getEmbedUrl(videoType, videoId);

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await updateVideo({
        id,
        title: value,
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
