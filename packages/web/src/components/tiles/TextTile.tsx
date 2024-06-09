import styles from "./TextTile.module.css";
import type { ClientTextTile } from "../../types/tiles";

type TextTileProps = ClientTextTile["text"];

export default function TextTile({ content }: TextTileProps) {
  return <div className={`${styles.text}`}>{content}</div>;
}
