import If from "@/jsx/if";
import Each from "@/jsx/each";
import Item from "@/components/item/Item";
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

  const zoneStyle = editor.dockSizes.derive((sizes) => {
    switch (edge) {
      case "TOP":
        return sizes.top ? { height: `${sizes.top}px` } : {};
      case "BOTTOM":
        return sizes.bottom ? { height: `${sizes.bottom}px` } : {};
      case "LEFT":
        return sizes.left ? { width: `${sizes.left}px` } : {};
      case "RIGHT":
        return sizes.right ? { width: `${sizes.right}px` } : {};
    }
  });

  return (
    <If condition={hasTiles}>
      <aside
        classList={{
          [styles.zone]: true,
          [styles[edgeStyle]]: true,
        }}
        style={zoneStyle}
        data-dock-zone={edge}
      >
        <Each items={tiles}>
          {(tile) => <Item classList={{ [styles.item]: true }} tile={tile} />}
        </Each>
      </aside>
    </If>
  );
}
