import { useMemo, useRef, useState } from "react";
import { classNames } from "@/utils/css";
import useDraggable from "@/hooks/useDraggable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
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
import type { DragDropEvent } from "@/utils/drag";
import { handleError } from "@/utils/errors";
import { useEditor } from "@/context/editor";

interface GridItemProps {
  id: string;
  placementId: string;
  style?: React.CSSProperties;
  className?: string;
  rows?: number;
  columns?: number;
  grow?: boolean;
  isEditable?: boolean;
  resizable?: boolean;
  allowDrop?: boolean;
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
  allowDrop = false,
  tile,
}: GridItemProps) {
  const ref = useRef<ResizeItem>(null);
  const editor = useEditor();
  useDraggable(ref, isEditable);
  useScrollIntoView(ref);
  const [isDragOver, setDragOver] = useState(false);

  const onDragStart = (event: DragDropEvent<ClientTile>) => {
    if (event.target === ref.current) {
      event.state.data = structuredClone(tile);
    }
  };

  const onDragEnter = (event: DragDropEvent<ClientTile>) => {
    const { state } = event;

    // Don't allow collections to be dropped on tiles
    if (state.data && state.data.type !== "COLLECTION") {
      setDragOver(true);
    }
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = async (event: DragDropEvent<ClientTile>) => {
    const { state } = event;

    // Don't add to collections here
    if (tile.type === "COLLECTION" || !state.data?.placementId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      await editor.createCollection({
        tileIds: [placementId, state.data.placementId],
      });
    } catch (error) {
      handleError(error);
    }
  };

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
      allowresize={resizable ? "allowresize" : undefined}
      allowdelete={isEditable ? "allowdelete" : undefined}
      class={classNames(
        styles.item,
        isEditable && styles.editable,
        grow && styles.grow,
        isDragOver && styles["drag-over"],
        className,
      )}
      style={combinedStyles}
      data-placement-id={placementId}
      data-animate-layout-id={placementId}
      ondnd-dragstart={onDragStart}
      ondnd-dragenter={allowDrop ? onDragEnter : undefined}
      ondnd-dragleave={allowDrop ? onDragLeave : undefined}
      ondnd-drop={allowDrop ? onDrop : undefined}
    >
      {getTileComponent(tile)}
    </resize-item>
  );
}
