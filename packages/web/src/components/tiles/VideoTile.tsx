import Caption from "./Caption";
import Tile, { type TileProps } from "./Tile";
import VideoIcon from "@/icons/video.svg?jsx";
import styles from "./VideoTile.module.css";
import type { ClientVideo } from "@/types/tiles";
import type Editor from "@/editor/Editor";

function getEmbedUrl(videoType: ClientVideo["videoType"], videoId: string) {
  switch (videoType) {
    case "YOUTUBE":
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;

    default:
      throw new Error(`Unsupported video type: ${videoType}`);
  }
}

interface VideoTileProps extends TileProps, ClientVideo {
  editor: Editor;
}

export default function VideoTile({
  editor,
  id,
  videoType,
  videoId,
  imageUrl,
  title,
  ...props
}: VideoTileProps) {
  const { isEditable } = editor;
  const embedUrl = getEmbedUrl(videoType, videoId);

  const onUpdateCaption = async (value: string) => {
    await editor.updateVideo({
      id,
      title: value,
    });
  };

  return (
    <Tile {...props}>
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
          onChange={onUpdateCaption}
          placeholder="Add a caption"
        />
      </figure>
      <VideoIcon className={styles.icon} aria-hidden="true" />
    </Tile>
  );
}
