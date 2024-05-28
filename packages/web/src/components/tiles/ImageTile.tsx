import styles from "./ImageTile.module.css";

export interface ImageTileProps {
  imageKey: string;
}

export default function ImageTile({ imageKey }: ImageTileProps) {
  const src = `${
    import.meta.env.PUBLIC_IMAGES_BASE_URL
  }/${imageKey}?class=thumbnail`;
  return (
    <div className={`editable ${styles.imageTile}`}>
      <img className={styles.image} src={src} alt="Image" />
    </div>
  );
}
