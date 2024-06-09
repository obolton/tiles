import { getImageUrl } from "../../utils/images";
import styles from "./ImageTile.module.css";
import type { ClientImageTile } from "../../types/tiles";

type ImageTileProps = ClientImageTile["image"];

export default function ImageTile({ imageKey, caption }: ImageTileProps) {
  const src = getImageUrl(imageKey);
  return (
    <figure className={styles.figure}>
      <img src={src} alt="Image" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
