import useEditable from "@/hooks/useEditable";
import { getImageUrl } from "@/utils/images";
import styles from "./ImageTile.module.css";
import type { ClientImageTile } from "@/types/tiles";

type ImageTileProps = ClientImageTile & {
  openEditModal: () => void;
};

export default function ImageTile({
  image: { imageKey, caption },
  openEditModal,
}: ImageTileProps) {
  const isEditable = useEditable();
  const src = getImageUrl(imageKey);
  return (
    <figure
      className={styles.figure}
      onClick={isEditable ? openEditModal : undefined}
    >
      <img src={src} alt="Image" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
