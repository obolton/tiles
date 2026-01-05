import { Computed } from "@/utils/reactivity";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import DockLayoutEditor from "./DockLayoutEditor";
import styles from "./DockZone.module.css";
import type Editor from "@/editor/Editor";
import type { DockEdge } from "@/models/Tile";
import type TileCollection from "@/models/TileCollection";

export interface DockZoneProps {
  editor: Editor;
  edge: DockEdge;
  tiles: TileCollection;
}

type EdgeStyle = "top" | "bottom" | "left" | "right";

export default function DockZone({ editor, edge, tiles }: DockZoneProps) {
  const isEmpty = tiles.derive((items) => items.length === 0);
  const edgeStyle = edge.toLowerCase() as EdgeStyle;

  const dimension = edge === "TOP" || edge === "BOTTOM" ? "height" : "width";

  const zoneStyle = editor.dockSizes.derive((sizes) => {
    const size = sizes[edge];
    return size !== null ? { [dimension]: `${size}px` } : {};
  });

  const visible = new Computed(
    [isEmpty, editor.isEditable],
    (empty, editable) => !empty || editable,
  );

  function ref(element: HTMLElement) {
    DockLayoutEditor.attach({
      element,
      edge,
      editor,
    });
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
      </Element>
    </If>
  );
}
