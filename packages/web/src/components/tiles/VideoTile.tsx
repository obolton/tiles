import Caption from "./Caption";
import Tile from "./Tile";
import VideoIcon from "@/icons/video.svg?jsx";
import styles from "./VideoTile.module.css";
import type Editor from "@/editor/Editor";
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

interface VideoTileProps extends VideoProperties {
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
  const embedUrl = getEmbedUrl(videoType.value, videoId.value);

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
          imagesrc={imageUrl.value ?? undefined}
          data-show-in-lightbox="true"
        />
        <Caption
          isEditable={isEditable}
          value={title.value}
          onChange={onUpdateCaption}
          placeholder="Add a caption"
        />
      </figure>
      <VideoIcon className={styles.icon} aria-hidden="true" />
    </Tile>
  );
}
