import { combine } from "@/utils/reactivity";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import DockLayoutEditor from "./DockLayoutEditor";
import { ResizeEvent } from "@/elements/resize/events";
import styles from "./DockZone.module.css";
import type Page from "@/models/Page";
import type { Reactive } from "@/utils/reactivity";
import type { DockEdge } from "@/models/Tile";
import type TileCollection from "@/models/TileCollection";

const MIN_DOCK_SIZE = 100;
const MAX_DOCK_RATIO = 0.5; // 50% of viewport

export interface DockZoneProps {
  page: Page;
  isEditable: Reactive<boolean>;
  edge: DockEdge;
  tiles: TileCollection;
  signal?: AbortSignal;
}

type EdgeStyle = "top" | "bottom" | "left" | "right";

export default function DockZone({
  page,
  isEditable,
  edge,
  tiles,
  signal,
}: DockZoneProps) {
  const isEmpty = tiles.derive((items) => items.length === 0);
  const edgeStyle = edge.toLowerCase() as EdgeStyle;
  const isHorizontal = edge === "TOP" || edge === "BOTTOM";

  const visible = combine(
    { isEmpty, isEditable },
    ({ isEmpty, isEditable }) => !isEmpty || isEditable,
  );

  function ref(element: HTMLElement) {
    DockLayoutEditor.attach({
      element,
      edge,
      page,
      isEditable,
      signal,
    });
  }

  const zoneResizeDirection = isHorizontal ? "vertical" : "horizontal";

  let initialSize = 0;

  function getNewSize(event: ResizeEvent): number {
    const delta = isHorizontal ? event.y : event.x;
    const sign = edge === "RIGHT" || edge === "BOTTOM" ? -1 : 1;
    const maxSize = isHorizontal
      ? window.innerHeight * MAX_DOCK_RATIO
      : window.innerWidth * MAX_DOCK_RATIO;
    return Math.max(
      MIN_DOCK_SIZE,
      Math.min(maxSize, initialSize + delta * sign),
    );
  }

  function onZoneResizeStart() {
    initialSize = page.dockSizes.value[edge];
  }

  function onZoneResizeDrag(event: ResizeEvent) {
    event.preventDefault();
    page.dockSizes.value = { ...page.dockSizes.value, [edge]: getNewSize(event) };
  }

  function onZoneResizeEnd(event: ResizeEvent) {
    const newSize = getNewSize(event);
    page.dockSizes.value = { ...page.dockSizes.value, [edge]: initialSize };
    page.setDockSizes({ [edge]: newSize });
  }

  const Element =
    edge === "TOP" ? "header" : edge === "BOTTOM" ? "footer" : "aside";

  return (
    <If condition={visible}>
      <Element
        ref={ref}
        classList={{
          [styles.zone]: true,
          [styles[edgeStyle]]: true,
        }}
        data-dock-zone={edge}
        data-empty={isEmpty}
      >
        <Each items={tiles}>
          {(tile) => <Item classList={{ [styles.item]: true }} tile={tile} />}
        </Each>

        <If condition={isEditable}>
          <resize-handle
            direction={zoneResizeDirection}
            classList={{ [styles["zone-resize"]]: true }}
            on:resizestart={onZoneResizeStart}
            on:resizedrag={onZoneResizeDrag}
            on:resizeend={onZoneResizeEnd}
          />
        </If>
      </Element>
    </If>
  );
}
