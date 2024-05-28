import { getImageUrl } from "../../utils/images";
import styles from "./ImageTile.module.css";

export interface ImageTileProps {
  imageKey: string;
}

export default function ImageTile({ imageKey }: ImageTileProps) {
  const src = getImageUrl(imageKey);
  return <img className={styles.image} src={src} alt="Image" />;
}
