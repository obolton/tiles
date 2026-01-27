import Section from "@/components/layouts/section/Section";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import TableTile from "@/components/tiles/TableTile";
import ChartTile from "@/components/tiles/ChartTile";
import SectionModel from "@/models/Section";
import TextModel from "@/models/Text";
import ImageModel from "@/models/Image";
import VideoModel from "@/models/Video";
import LinkModel from "@/models/Link";
import PageLinkModel from "@/models/PageLink";
import MapModel from "@/models/Map";
import TableModel from "@/models/Table";
import ChartModel from "@/models/Chart";
import { reactive, Computed } from "@/utils/reactivity";
import { getThemeStyles } from "@/utils/themes";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import If from "@/jsx/if";
import InsertButton from "@/components/buttons/InsertButton";
import { LANDSCAPE_SIZE, PORTRAIT_SIZE } from "@/constants/size";
import styles from "./Item.module.css";
import type Tile from "@/models/Tile";
import type PageItem from "@/elements/item/PageItem";
import type { ResizeDirection } from "@/elements/item/PageItem";
import type { DragDropEvent } from "@/utils/drag";
import type { Reactive } from "@/utils/reactivity";
import type { StyleDeclaration } from "@/jsx/html-attributes";
import type { Dimensions } from "@/models/Tile";

export interface ItemProps {
  style?: StyleDeclaration;
  classList?: { [k: string]: boolean | Reactive<boolean> };
  editable?: boolean | Reactive<boolean>;
  tile: Tile;
  tabindex?: number | Reactive<number | undefined>;
  resize?: Reactive<ResizeDirection | null>;
  showInsertButton?: boolean;
  fullBleed?: boolean;
  autoHeight?: boolean;
}

function getTileComponent(
  tile: Tile,
  showToolbar: Reactive<boolean>,
  autoHeight: boolean,
) {
  if (tile instanceof SectionModel) {
    return <Section section={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof ImageModel) {
    return <ImageTile image={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof VideoModel) {
    return <VideoTile video={tile} />;
  }
  if (tile instanceof TextModel) {
    return (
      <TextTile text={tile} showToolbar={showToolbar} autoHeight={autoHeight} />
    );
  }
  if (tile instanceof MapModel) {
    return <MapTile map={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof LinkModel) {
    return <LinkTile link={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof PageLinkModel) {
    return <PageLinkTile pageLink={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof TableModel) {
    return <TableTile table={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof ChartModel) {
    return <ChartTile chart={tile} showToolbar={showToolbar} />;
  }
  throw new Error(`Unknown tile type: ${tile.type}`);
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
  tabindex,
  resize,
  showInsertButton = false,
  fullBleed = false,
  autoHeight = false,
}: ItemProps) {
  const { id, dimensions, x, y, width, height, rowSpan, hide, editor } = tile;

  let item: PageItem;
  const ref = (element: PageItem) => {
    item = element;
  };

  const isSelected = editor.selection.derive((selection) =>
    selection.has(tile),
  );

  const isReferenced = editor.references.derive((refs) => refs.has(tile));

  // Show toolbar when this tile is the only selected item
  const showToolbar = editor.selection.derive(
    (selection) => selection.has(tile) && selection.size === 1,
  );

  const themeStyles = new Computed(
    [tile.background, tile.theme, tile.textColor] as const,
    (background, theme, textColor) =>
      getThemeStyles(theme, { background, textColor }),
  );

  function onPointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON || !editor.isEditable.value) {
      return;
    }

    event.stopPropagation();

    if (editor.isPromptOpen.value) {
      event.preventDefault();
      editor.toggleReference(id);
      return;
    }

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

  function onDragStart(event: DragDropEvent) {
    if (event.target === item) {
      event.state.data = { tile };
    }
  }

  const position =
    x && y
      ? new Computed([x, y], (xValue, yValue) => ({
          "--x": xValue.toString(),
          "--y": yValue.toString(),
        }))
      : reactive({});

  const combinedStyles = new Computed(
    [dimensions, width, height, rowSpan, position, themeStyles] as const,
    (
      dimensionsValue,
      widthValue,
      heightValue,
      rowSpanValue,
      positionValue,
      themeVars,
    ) => ({
      ...style,
      ...positionValue,
      ...getSizeStyle(dimensionsValue, widthValue, heightValue),
      "--rows": rowSpanValue.toString(),
      ...themeVars,
    }),
  );

  const show = new Computed(
    [editor.isEditable, hide] as const,
    (editable, hidden) => !hidden || editable,
  );

  const resizeDirection = resize
    ? new Computed(
        [resize, editor.isEditable] as const,
        (direction, isEditable) => (isEditable ? direction : null),
      )
    : undefined;

  return (
    <If condition={show}>
      <page-item
        id={id}
        ref={ref}
        aria-selected={isSelected}
        allowdrag={editable}
        resize={resizeDirection}
        classList={{
          [styles.item]: true,
          [styles.draggable]: editable,
          [styles.selected]: isSelected,
          [styles.referenced]: isReferenced,
          [styles["auto-height"]]: autoHeight,
          [styles.hide]: hide,
          [styles["full-bleed"]]: fullBleed,
          ...classList,
        }}
        style={combinedStyles}
        tabindex={tabindex}
        on:pointerdown={onPointerDown}
        on:dnd-dragstart={onDragStart}
      >
        {getTileComponent(tile, showToolbar, autoHeight)}

        {showInsertButton && (
          <If condition={isSelected}>
            <InsertButton
              classList={{ small: true, [styles.insert]: true }}
              id={`${id}-insert`}
              sectionId={tile.sectionId}
              afterId={id}
            />
          </If>
        )}
      </page-item>
    </If>
  );
}
