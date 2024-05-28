import styles from "./TextTile.module.css";

export interface TextTileProps {
  content: string;
}

export default function TextTile({ content }: TextTileProps) {
  return <div className={`${styles.text}`}>{content}</div>;
}
