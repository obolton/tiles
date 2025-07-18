import styles from "./Item.module.css";
import type PageItem from "@/elements/item/PageItem";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import TableTile from "@/components/tiles/TableTile";
import { flag, reactive, Computed } from "@/utils/reactivity";
import type { Tile } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";

export interface ItemProps {
  editor: Editor;
  id: string;
  placementId: string;
  style?: JSX.StyleDeclaration;
  classList?: { [k: string]: boolean | Reactive<boolean> };
  x?: Reactive<number>;
  y?: Reactive<number>;
  rows: Reactive<number>;
  minRows?: number;
  columns: Reactive<number>;
  minColumns?: number;
  maxColumns?: number;
  grow?: boolean;
  deletable?: boolean | Reactive<boolean>;
  draggable?: boolean | Reactive<boolean>;
  resizable?: boolean | Reactive<boolean>;
  tile: Tile;
  tabIndex?: number | Reactive<number | undefined>;
}

function getTileComponent(
  tile: Tile,
  hasFocus: Reactive<boolean>,
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
    case "TABLE":
      return <TableTile {...tile} editor={editor} hasFocus={hasFocus} />;
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

export default function Item({
  editor,
  id,
  placementId,
  classList,
  style,
  x,
  y,
  rows,
  minRows = 1,
  columns,
  minColumns = 1,
  maxColumns = 12,
  grow,
  deletable = false,
  draggable = false,
  resizable = false,
  tile,
  tabIndex,
}: ItemProps) {
  let item: PageItem;
  const ref = (element: PageItem) => {
    item = element;
  };

  const hasFocus = flag(false);

  const onFocusIn = () => {
    if (editor.isEditable.value) {
      hasFocus.value = true;
      editor.focusedTile.value = placementId;
    }
  };

  const onFocusOut = (event: FocusEvent) => {
    const element = event.currentTarget as HTMLElement;

    if (
      event.relatedTarget instanceof Element &&
      element.contains(event.relatedTarget)
    ) {
      return;
    }

    hasFocus.value = false;
    editor.focusedTile.value = null;
  };

  const onDragStart = (event: DragDropEvent<Tile>) => {
    if (event.target === item) {
      event.state.data = tile;
    }
  };

  const onDelete = () => item?.delete();

  const position =
    x && y
      ? new Computed([x, y], (xValue, yValue) => ({
          "--column": (xValue + 1).toString(),
          "--row": (yValue + 1).toString(),
        }))
      : reactive({});

  const combinedStyles = new Computed(
    [columns, rows, position] as const,
    (columns, rows, positionValue) => ({
      ...style,
      ...positionValue,
      "--columns": Math.min(
        Math.max(columns, minColumns),
        maxColumns,
      ).toString(),
      "--min-columns": minColumns.toString(),
      "--rows": Math.max(rows, minRows).toString(),
      "--min-rows": minRows.toString(),
    }),
  );

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
        ...classList,
      }}
      style={combinedStyles}
      data-placement-id={placementId}
      data-animate-layout-id={placementId}
      tabIndex={tabIndex}
      on:dnd-dragstart={onDragStart}
      on:focusin={onFocusIn}
      on:focusout={onFocusOut}
      on:pointerdown={handlePointerDown}
    >
      {getTileComponent(tile, hasFocus, onDelete, editor)}
    </page-item>
  );
}
