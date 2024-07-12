import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { getMapImageUrl } from "@/utils/images";
import { editTile } from "@/utils/edit";
import Tile from "./Tile";
import styles from "./PlaceTile.module.css";
import type { ClientPlaceTile } from "@/types/tiles";

type PlaceTileProps = {
  tile: ClientPlaceTile;
};

export default function PlaceTile({ tile }: PlaceTileProps) {
  const {
    id,
    place: { name, thumbnailKey },
  } = tile;
  const isEditable = useEditable();
  const edit = useCallback(() => editTile(id, "PLACE"), [id]);
  const src = getMapImageUrl(thumbnailKey);
  return (
    <Tile tile={tile}>
      <figure className={styles.figure} onClick={isEditable ? edit : undefined}>
        <img src={src} alt={`A map showing ${name}`} draggable={!isEditable} />
        <figcaption>{name}</figcaption>
      </figure>
    </Tile>
  );
}
