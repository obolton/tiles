import { useCallback, useMemo, useRef, useState } from "react";
import { classNames } from "@/utils/css";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import styles from "./GridItem.module.css";
import type PageItem from "@/elements/item/PageItem";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import EventTile from "@/components/tiles/EventTile";
import CollectionTile from "@/components/tiles/CollectionTile";
import type { Tile } from "@/types/layout";
import type { DragDropEvent } from "@/utils/drag";
import { handleError } from "@/utils/errors";
import { useEditor } from "@/context/editor";
import useEditable from "@/hooks/useEditable";

interface GridItemProps {
  id: string;
  collectionId: string;
  placementId: string;
  style?: React.CSSProperties;
  className?: string;
  rows?: number;
  columns?: number;
  grow?: boolean;
  deletable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  allowDrop?: boolean;
  tile: Tile;
  tabIndex?: number;
}

function getTileComponent(tile: Tile, hasFocus: boolean, onDelete: () => void) {
  const type = tile.type;
  switch (type) {
    case "IMAGE":
      return <ImageTile {...tile} />;
    case "VIDEO":
      return <VideoTile {...tile} />;
    case "TEXT":
      // @ts-expect-error Rich text
      return <TextTile {...tile} hasFocus={hasFocus} onDelete={onDelete} />;
    case "MAP":
      return <MapTile {...tile} hasFocus={hasFocus} />;
    case "LINK":
      return <LinkTile {...tile} hasFocus={hasFocus} />;
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

function handlePointerDown(event: React.PointerEvent<PageItem>) {
  if (!event.currentTarget.contains(document.activeElement)) {
    event.currentTarget.focus();
  }
}

export default function GridItem({
  id,
  collectionId,
  placementId,
  className,
  style,
  rows,
  columns,
  grow = false,
  deletable = false,
  draggable = false,
  resizable = false,
  allowDrop = false,
  tile,
  tabIndex,
}: GridItemProps) {
  const ref = useRef<PageItem>(null);
  const editor = useEditor();
  const isEditable = useEditable();
  useScrollIntoView(ref);

  const [hasFocus, setHasFocus] = useState(false);
  const onFocus = useCallback(() => {
    setHasFocus(true);
    editor.focusedTile.value = id;
  }, [id, editor]);

  const onBlur = useCallback(
    (event: React.FocusEvent<PageItem>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setHasFocus(false);
        editor.focusedTile.value = null;
      }
    },
    [editor],
  );

  const [isDragOver, setDragOver] = useState(false);
  const onDragStart = (event: DragDropEvent<Tile>) => {
    if (event.target === ref.current) {
      event.state.data = structuredClone(tile);
    }
  };

  const onDragEnter = (event: DragDropEvent<Tile>) => {
    const { state } = event;

    // Don't allow collections to be dropped on tiles
    if (!state.data || state.data.type === "COLLECTION") {
      event.preventDefault();
      return;
    }

    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = async (event: DragDropEvent<Tile>) => {
    const { state } = event;

    // Don't add to collections here
    if (tile.type === "COLLECTION" || !state.data?.placementId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      await editor.createCollection({
        collectionId,
        tileIds: [placementId, state.data.placementId],
      });
    } catch (error) {
      handleError(error);
    }
  };

  const onDelete = () => ref.current?.delete();

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
    <page-item
      id={id}
      ref={ref}
      allowdrag={draggable}
      allowresize={resizable}
      allowdelete={deletable}
      class={classNames(
        styles.item,
        draggable && styles.draggable,
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
      data-drop={allowDrop ? "true" : undefined}
      onFocus={isEditable ? onFocus : undefined}
      onBlur={isEditable ? onBlur : undefined}
      tabIndex={tabIndex}
      onPointerDown={handlePointerDown}
    >
      {getTileComponent(tile, hasFocus, onDelete)}
    </page-item>
  );
}
