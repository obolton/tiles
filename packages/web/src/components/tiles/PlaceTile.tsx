import useEditable from "@/hooks/useEditable";
import { getMapImageUrl } from "../../utils/images";
import styles from "./PlaceTile.module.css";
import type { ClientPlaceTile } from "../../types/tiles";

type PlaceTileProps = ClientPlaceTile & {
  openEditModal: () => void;
};

export default function PlaceTile({
  place: { name, thumbnailKey },
  openEditModal,
}: PlaceTileProps) {
  const isEditable = useEditable();
  const src = getMapImageUrl(thumbnailKey);
  return (
    <figure
      className={styles.figure}
      onClick={isEditable ? openEditModal : undefined}
    >
      <img src={src} alt={`A map showing ${name}`} />
      <figcaption>{name}</figcaption>
    </figure>
  );
}
