import Section from "@/components/layouts/section/Section";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import TableTile from "@/components/tiles/TableTile";
import ChartTile from "@/components/tiles/ChartTile";
import { flag, reactive, Computed } from "@/utils/reactivity";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import If from "@/jsx/if";
import { LANDSCAPE_SIZE, PORTRAIT_SIZE } from "@/constants/size";
import styles from "./Item.module.css";
import type PageItem from "@/elements/item/PageItem";
import type { ResizeDirection } from "@/elements/item/PageItem";
import type { Tile } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";
import type { DragData } from "@/editor/LayoutEditor";
import type { Dimensions } from "@/models/Tile";

export interface ItemProps {
  style?: JSX.StyleDeclaration;
  classList?: { [k: string]: boolean | Reactive<boolean> };
  editable?: boolean | Reactive<boolean>;
  tile: Tile;
  tabIndex?: number | Reactive<number | undefined>;
  resize?: Reactive<ResizeDirection | null>;
}

function getTileComponent(tile: Tile, hasFocus: Reactive<boolean>) {
  const type = tile.type;
  switch (type) {
    case "SECTION":
      return <Section section={tile} />;
    case "IMAGE":
      return <ImageTile image={tile} hasFocus={hasFocus} />;
    case "VIDEO":
      return <VideoTile video={tile} />;
    case "TEXT":
      return <TextTile text={tile} hasFocus={hasFocus} />;
    case "MAP":
      return <MapTile map={tile} hasFocus={hasFocus} />;
    case "LINK":
      return <LinkTile link={tile} hasFocus={hasFocus} />;
    case "PAGE_LINK":
      return <PageLinkTile pageLink={tile} />;
    case "TABLE":
      return <TableTile table={tile} hasFocus={hasFocus} />;
    case "CHART":
      return <ChartTile chart={tile} hasFocus={hasFocus} />;
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

export function getSizeStyle(
  dimensions: Dimensions,
  width: number,
  height: number,
) {
  switch (dimensions) {
    case "LANDSCAPE":
      return {
        "--width": LANDSCAPE_SIZE.width.toString(),
        "--height": LANDSCAPE_SIZE.height.toString(),
      };
    case "PORTRAIT":
      return {
        "--width": PORTRAIT_SIZE.width.toString(),
        "--height": PORTRAIT_SIZE.height.toString(),
      };
    case "CUSTOM":
    default:
      return {
        "--width": width.toString(),
        "--height": height.toString(),
      };
  }
}

export default function Item({
  classList,
  style,
  editable = false,
  tile,
  tabIndex,
  resize,
}: ItemProps) {
  const { id, dimensions, x, y, width, height, rowSpan, block, hide, editor } =
    tile;

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

    if (!isSelected.value) {
      editor.select([id], false);
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
    [dimensions, width, height, rowSpan, position] as const,
    (
      dimensionsValue,
      widthValue,
      heightValue,
      rowSpanValue,
      positionValue,
    ) => ({
      ...style,
      ...positionValue,
      ...getSizeStyle(dimensionsValue, widthValue, heightValue),
      "--rows": rowSpanValue.toString(),
    }),
  );

  const show = new Computed(
    [editor.isEditable, hide] as const,
    (editable, hidden) => !hidden || editable,
  );

  return (
    <If condition={show}>
      <page-item
        id={id}
        ref={ref}
        allowdrag={editable}
        resize={resize}
        classList={{
          [styles.item]: true,
          [styles.draggable]: editable,
          [styles.selected]: isSelected,
          [styles.block]: block,
          [styles.hide]: hide,
          ...classList,
        }}
        style={combinedStyles}
        tabIndex={tabIndex}
        on:pointerdown={onPointerDown}
        on:dnd-dragstart={onDragStart}
        on:focusin={onFocusIn}
        on:focusout={onFocusOut}
      >
        {getTileComponent(tile, hasFocus)}
      </page-item>
    </If>
  );
}
