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
import { Store, DerivedStore } from "@/utils/stores";
import type { StoreInterface } from "@/utils/stores";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";

interface GridItemProps {
  editor: Editor;
  id: string;
  collectionId: string;
  placementId: string;
  style?: JSX.StyleDeclaration;
  classList?: { [k: string]: boolean | StoreInterface<boolean> };
  rows: StoreInterface<number>;
  minRows?: number;
  columns: StoreInterface<number>;
  minColumns?: number;
  grow?: boolean;
  deletable?: boolean | StoreInterface<boolean>;
  draggable?: boolean | StoreInterface<boolean>;
  resizable?: boolean | StoreInterface<boolean>;
  allowDrop?: boolean;
  tile: Tile;
  tabIndex?: number | StoreInterface<number | undefined>;
}

function getTileComponent(
  tile: Tile,
  hasFocus: StoreInterface<boolean>,
  onDelete: () => void,
  editor: Editor,
) {
  const type = tile.type;
  switch (type) {
    case "IMAGE":
      return (
        <ImageTile
          {...tile}
          editor={editor}
          hasFocus={hasFocus}
          onDelete={onDelete}
        />
      );
    case "VIDEO":
      return <VideoTile {...tile} editor={editor} />;
    case "TEXT":
      return (
        <TextTile
          {...tile}
          editor={editor}
          hasFocus={hasFocus}
          onDelete={onDelete}
        />
      );
    case "MAP":
      return <MapTile {...tile} editor={editor} hasFocus={hasFocus} />;
    case "LINK":
      return <LinkTile {...tile} editor={editor} hasFocus={hasFocus} />;
    case "PAGE_LINK":
      return <PageLinkTile {...tile} editor={editor} />;
    case "EVENT":
      return <EventTile {...tile} editor={editor} />;
    case "COLLECTION":
      return <CollectionTile {...tile} editor={editor} />;
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

function handlePointerDown(event: PointerEvent) {
  const item = event.currentTarget as HTMLElement;
  if (!item.contains(document.activeElement)) {
    item.focus({ preventScroll: true });
  }
}

export default function GridItem({
  editor,
  id,
  collectionId,
  placementId,
  classList,
  style,
  rows,
  minRows = 1,
  columns,
  minColumns = 1,
  grow = false,
  deletable = false,
  draggable = false,
  resizable = false,
  allowDrop = false,
  tile,
  tabIndex,
}: GridItemProps) {
  let item: PageItem;
  const ref = (element: PageItem) => {
    item = element;
  };

  const hasFocus = new Store(false);
  const isDragOver = new Store(false);
  const onFocus = () => {
    if (editor.isEditable.value) {
      hasFocus.value = true;
      editor.focusedTile.value = placementId;
    }
  };

  const onBlur = (event: FocusEvent) => {
    const element = event.currentTarget as HTMLElement;
    if (
      editor.isEditable.value &&
      (!(event.relatedTarget instanceof Element) ||
        !element.contains(event.relatedTarget))
    ) {
      hasFocus.value = false;
      editor.focusedTile.value = null;
    }
  };

  const onDragStart = (event: DragDropEvent<Tile>) => {
    if (event.target === item) {
      event.state.data = tile;
    }
  };

  const onDragEnter = (event: DragDropEvent<Tile>) => {
    const { state } = event;

    // Don't allow collections to be dropped on tiles
    if (!state.data || state.data.type === "COLLECTION") {
      event.preventDefault();
      return;
    }

    isDragOver.value = true;
  };

  const onDragLeave = () => {
    isDragOver.value = false;
  };

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

  const onDelete = () => item?.delete();

  const combinedStyles = new DerivedStore([columns, rows], (columns, rows) => ({
    ...style,
    "--columns": Math.max(columns, minColumns).toString(),
    "--min-columns": minColumns.toString(),
    "--rows": Math.max(rows, minRows).toString(),
    "--min-rows": minRows.toString(),
  }));

  return (
    <page-item
      id={id}
      ref={ref}
      allowdrag={draggable}
      allowresize={resizable}
      allowdelete={deletable}
      classList={{
        [styles.item]: true,
        [styles.draggable]: draggable,
        [styles.grow]: grow,
        [styles["drag-over"]]: isDragOver,
        ...classList,
      }}
      style={combinedStyles}
      data-placement-id={placementId}
      data-animate-layout-id={placementId}
      ondnd-dragstart={onDragStart}
      ondnd-dragenter={allowDrop ? onDragEnter : undefined}
      ondnd-dragleave={allowDrop ? onDragLeave : undefined}
      ondnd-drop={allowDrop ? onDrop : undefined}
      data-drop={allowDrop ? "true" : undefined}
      onfocus={onFocus}
      onfocusout={onBlur}
      tabIndex={tabIndex}
      onpointerdown={handlePointerDown}
    >
      {getTileComponent(tile, hasFocus, onDelete, editor)}
    </page-item>
  );
}
