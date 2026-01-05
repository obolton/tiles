import { Computed } from "@/utils/reactivity";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import DockLayoutEditor from "./DockLayoutEditor";
import type Editor from "@/editor/Editor";
import type { DockEdge } from "@/models/Tile";
import type TileCollection from "@/models/TileCollection";
import styles from "./DockZone.module.css";

interface DockZoneProps {
  editor: Editor;
  edge: DockEdge;
  tiles: TileCollection;
}

type EdgeStyle = "top" | "bottom" | "left" | "right";

export default function DockZone({ editor, edge, tiles }: DockZoneProps) {
  const hasTiles = tiles.derive((items) => items.length > 0);
  const edgeStyle = edge.toLowerCase() as EdgeStyle;

  const dimension = edge === "TOP" || edge === "BOTTOM" ? "height" : "width";

  const zoneStyle = editor.dockSizes.derive((sizes) => {
    const size = sizes[edge];
    return size !== null ? { [dimension]: `${size}px` } : {};
  });

  const shouldRender = new Computed(
    [hasTiles, editor.isEditable],
    (has, editable) => has || editable,
  );

  function ref(element: HTMLElement) {
    DockLayoutEditor.attach({
      element,
      edge,
      editor,
    });
  }

  return (
    <If condition={shouldRender}>
      <aside
        ref={ref}
        classList={{
          [styles.zone]: true,
          [styles[edgeStyle]]: true,
        }}
        style={zoneStyle}
        data-dock-zone={edge}
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
      </aside>
    </If>
  );
}
