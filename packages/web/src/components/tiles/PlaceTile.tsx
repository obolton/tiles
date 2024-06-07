import { getMapImageUrl } from "../../utils/images";
import styles from "./PlaceTile.module.css";
import type { ClientPlaceTile } from "../../types/tiles";

export type PlaceTileProps = ClientPlaceTile["place"];

export default function PlaceTile({ name, thumbnailKey }: PlaceTileProps) {
  const src = getMapImageUrl(thumbnailKey);
  return <img className={styles.map} src={src} alt={`A map showing ${name}`} />;
}
