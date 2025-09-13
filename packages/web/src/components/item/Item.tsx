import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import TableTile from "@/components/tiles/TableTile";
import { flag, reactive, Computed } from "@/utils/reactivity";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import styles from "./Item.module.css";
import type PageItem from "@/elements/item/PageItem";
import type { Tile } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";
import type { DragData } from "@/editor/LayoutEditor";

export interface ItemProps {
  editor: Editor;
  id: string;
  placementId: string;
  style?: JSX.StyleDeclaration;
  classList?: { [k: string]: boolean | Reactive<boolean> };
  editable?: boolean | Reactive<boolean>;
  x?: Reactive<number>;
  y?: Reactive<number>;
  width: Reactive<number>;
  height: Reactive<number>;
  rowSpan: Reactive<number>;
  block?: Reactive<boolean>;
  tile: Tile;
  tabIndex?: number | Reactive<number | undefined>;
}

function getTileComponent(
  tile: Tile,
  hasFocus: Reactive<boolean>,
  editor: Editor,
) {
  const type = tile.type;
  switch (type) {
    case "IMAGE":
      return <ImageTile {...tile} editor={editor} hasFocus={hasFocus} />;
    case "VIDEO":
      return <VideoTile {...tile} editor={editor} />;
    case "TEXT":
      return <TextTile {...tile} editor={editor} hasFocus={hasFocus} />;
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

export default function Item({
  editor,
  id,
  placementId,
  classList,
  style,
  editable = false,
  x,
  y,
  width,
  height,
  rowSpan,
  block,
  tile,
  tabIndex,
}: ItemProps) {
  let item: PageItem;
  const ref = (element: PageItem) => {
    item = element;
  };

  const hasFocus = flag(false);
  const isSelected = editor.selection.derive((selection) =>
    selection.has(tile),
  );

  function onPointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON || !editor.isEditable.value) {
      return;
    }

    event.stopPropagation();

    if (event.shiftKey) {
      event.preventDefault();

      if (isSelected.value) {
        editor.deselect([id]);

        if (
          document.activeElement instanceof HTMLElement &&
          item?.contains(document.activeElement)
        ) {
          document.activeElement.blur();
        }
      } else {
        editor.select([id], true);
        item?.focus({ preventScroll: true });
      }
    } else {
      editor.select([id], false);
    }
  }

  function onFocusIn() {
    if (editor.isEditable.value) {
      hasFocus.value = true;
    }
  }

  function onFocusOut(event: FocusEvent) {
    const element = event.currentTarget as HTMLElement;

    if (
      event.relatedTarget instanceof Element &&
      element.contains(event.relatedTarget)
    ) {
      return;
    }

    hasFocus.value = false;
  }

  function onDragStart(event: DragDropEvent<DragData>) {
    if (event.target === item) {
      event.state.data = { tile };
    }
  }

  const position =
    x && y
      ? new Computed([x, y], (xValue, yValue) => ({
          "--column": (xValue + 1).toString(),
          "--row": (yValue + 1).toString(),
        }))
      : reactive({});

  const combinedStyles = new Computed(
    [width, height, rowSpan, position] as const,
    (widthValue, heightValue, rowSpanValue, positionValue) => ({
      ...style,
      ...positionValue,
      "--width": widthValue.toString(),
      "--height": heightValue.toString(),
      "--rows": rowSpanValue.toString(),
      viewTransitionName: `item-${id}`,
    }),
  );

  return (
    <page-item
      id={id}
      ref={ref}
      allowdrag={editable}
      allowresize={editable}
      classList={{
        [styles.item]: true,
        [styles.draggable]: editable,
        [styles.selected]: isSelected,
        [styles.block]: block,
        ...classList,
      }}
      style={combinedStyles}
      data-placement-id={placementId}
      data-animate-layout-id={placementId}
      tabIndex={tabIndex}
      on:pointerdown={onPointerDown}
      on:dnd-dragstart={onDragStart}
      on:focusin={onFocusIn}
      on:focusout={onFocusOut}
    >
      {getTileComponent(tile, hasFocus, editor)}
    </page-item>
  );
}
