import { combine } from "@/utils/reactivity";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import DockLayoutEditor from "./DockLayoutEditor";
import { ResizeEvent } from "@/elements/resize/events";
import styles from "./DockZone.module.css";
import type Editor from "@/editor/Editor";
import type { DockEdge } from "@/models/Tile";
import type TileCollection from "@/models/TileCollection";

const MIN_DOCK_SIZE = 100;
const MAX_DOCK_RATIO = 0.5; // 50% of viewport

export interface DockZoneProps {
  editor: Editor;
  edge: DockEdge;
  tiles: TileCollection;
}

type EdgeStyle = "top" | "bottom" | "left" | "right";

export default function DockZone({ editor, edge, tiles }: DockZoneProps) {
  const isEmpty = tiles.derive((items) => items.length === 0);
  const edgeStyle = edge.toLowerCase() as EdgeStyle;
  const isHorizontal = edge === "TOP" || edge === "BOTTOM";

  const dimension = isHorizontal ? "height" : "width";

  const zoneStyle = editor.dockSizes.derive((sizes) => {
    const size = sizes[edge];
    return size !== null ? { [dimension]: `${size}px` } : {};
  });

  const visible = combine({ isEmpty, isEditable: editor.isEditable }).derive(
    ({ isEmpty, isEditable }) => !isEmpty || isEditable,
  );

  function ref(element: HTMLElement) {
    DockLayoutEditor.attach({
      element,
      edge,
      editor,
    });
  }

  const zoneResizeDirection = isHorizontal ? "vertical" : "horizontal";

  function onZoneResizeEnd(event: ResizeEvent) {
    const initialSize = editor.dockSizes.value[edge] ?? 0;

    let delta: number;
    switch (edge) {
      case "LEFT":
        delta = event.x;
        break;
      case "RIGHT":
        delta = -event.x;
        break;
      case "TOP":
        delta = event.y;
        break;
      case "BOTTOM":
        delta = -event.y;
        break;
    }

    const maxSize = isHorizontal
      ? window.innerHeight * MAX_DOCK_RATIO
      : window.innerWidth * MAX_DOCK_RATIO;

    const newSize = Math.max(
      MIN_DOCK_SIZE,
      Math.min(maxSize, initialSize + delta),
    );

    editor.setDockSizes({ [edge]: newSize });
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
        style={zoneStyle}
        data-dock-zone={edge}
        data-empty={isEmpty}
      >
        <Each items={tiles}>
          {(tile) => (
            <Item
              classList={{ [styles.item]: true }}
              editable={editor.isEditable}
              tile={tile}
            />
          )}
        </Each>

        <If condition={editor.isEditable}>
          <resize-handle
            direction={zoneResizeDirection}
            classList={{ [styles["zone-resize"]]: true }}
            on:resizeend={onZoneResizeEnd}
          />
        </If>
      </Element>
    </If>
  );
}
