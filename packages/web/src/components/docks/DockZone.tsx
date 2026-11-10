import { combine } from "carillon";
import If from "jsx/if";
import Each from "jsx/each";
import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import DockLayoutEditor from "./DockLayoutEditor";
import styles from "./DockZone.module.css";
import type Page from "@/models/Page";
import type { Reactive } from "carillon";
import type { DockEdge } from "@/models/Tile";
import type TileCollection from "@/models/TileCollection";

const MIN_DOCK_SIZE = 100;

export interface DockZoneProps {
  page: Page;
  isEditable: Reactive<boolean>;
  edge: DockEdge;
  tiles: TileCollection;
  signal?: AbortSignal;
}

type EdgeStyle = "top" | "bottom" | "left" | "right";

export default function DockZone({ page, isEditable, edge, tiles, signal }: DockZoneProps) {
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

  return (
    <If condition={visible}>
      <resizable-panel
        ref={ref}
        classList={{
          [styles.zone]: true,
          [styles[edgeStyle]]: true,
        }}
        role={isHorizontal ? undefined : "complementary"}
        aria-label={`${edgeStyle} dock`}
        edge={edgeStyle}
        size={page.dockSizes[edge]}
        min={MIN_DOCK_SIZE}
        disabled={isEditable.derive((editable) => !editable)}
        data-dock-zone={edge}
        data-empty={isEmpty}
        on:panelresize={(event) => page.dockSizes[edge].preview(event.size)}
        on:panelresizeend={(event) => (page.dockSizes[edge].value = event.size)}
      >
        <Each items={tiles}>
          {(tile) => (
            <Item classList={{ [styles.item]: true }} tile={tile}>
              <TileContent tile={tile} />
            </Item>
          )}
        </Each>
      </resizable-panel>
    </If>
  );
}
