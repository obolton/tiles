import useEditable from "@/hooks/useEditable";
import type { ClientVideo } from "@/types/tiles";
import { useCallback } from "react";
import Caption from "./Caption";
import Tile, { type TileProps } from "./Tile";
import VideoIcon from "@/icons/video.svg?jsx";
import styles from "./VideoTile.module.css";
import { useEditor } from "@/context/editor";

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
  const editor = useEditor();
  const isEditable = useEditable();
  const embedUrl = getEmbedUrl(videoType, videoId);

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await editor.updateVideo({
        id,
        title: value,
      });
    },
    [editor, id],
  );

  return (
    <Tile {...props}>
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
      <VideoIcon className={styles.icon} aria-hidden="true" />
    </Tile>
  );
}
