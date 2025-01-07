import { useCallback, useMemo, useRef } from "react";
import { classNames } from "@/utils/css";
import useCreateCollection from "@/hooks/useCreateCollection";
import useDraggable from "@/hooks/useDraggable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import DeleteButton from "../tiles/DeleteButton";
import styles from "./GridItem.module.css";
import type ResizeItem from "@/components/resize/ResizeItem";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import EventTile from "@/components/tiles/EventTile";
import CollectionTile from "@/components/tiles/CollectionTile";
import type { ClientTile } from "@/types/tiles";

interface GridItemProps {
  id: string;
  placementId: string;
  style?: React.CSSProperties;
  className?: string;
  rows: number;
  columns: number;
  grow?: boolean;
  isEditable?: boolean;
  resizable?: boolean;
  dropGroup?: string;
  onDelete: (id: string) => void;
  tile: ClientTile;
}

function getTileComponent(tile: ClientTile) {
  const type = tile.type;
  switch (type) {
    case "IMAGE":
      return <ImageTile {...tile} />;
    case "VIDEO":
      return <VideoTile {...tile} />;
    case "TEXT":
      // @ts-expect-error Rich text
      return <TextTile {...tile} />;
    case "MAP":
      return <MapTile {...tile} />;
    case "LINK":
      return <LinkTile {...tile} />;
    case "PAGE_LINK":
      return <PageLinkTile {...tile} />;
    case "EVENT":
      return <EventTile {...tile} />;
    case "COLLECTION":
      return <CollectionTile {...tile} />;
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

export default function GridItem({
  id,
  placementId,
  className,
  style,
  rows,
  columns,
  grow = false,
  isEditable = false,
  resizable = false,
  dropGroup,
  onDelete,
  tile,
}: GridItemProps) {
  const ref = useRef<ResizeItem>(null);
  const onDrop = useCreateCollection(placementId ?? "");
  useDraggable(ref, isEditable && !!dropGroup);
  useScrollIntoView(ref);

  const handleDelete = useCallback(
    () => void onDelete(placementId),
    [placementId, onDelete],
  );

  const combinedStyles = useMemo(
    () =>
      ({
        ...style,
        "--columns": columns,
        "--rows": rows,
      }) as React.CSSProperties,
    [style, columns, rows],
  );

  return (
    <resize-item
      id={id}
      ref={ref}
      disabled={!resizable ? "disabled" : undefined}
      class={classNames(
        styles.item,
        isEditable && styles.editable,
        grow && styles.grow,
        className,
      )}
      style={combinedStyles}
      data-rows={rows}
      data-columns={columns}
      data-drop-group={dropGroup}
      data-placement-id={placementId}
      ondrag:drop-on={onDrop}
    >
      {getTileComponent(tile)}
      {isEditable ? (
        <DeleteButton className={styles.delete} onPress={handleDelete} />
      ) : null}
    </resize-item>
  );
}
