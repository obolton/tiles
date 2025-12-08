import Each from "@/jsx/each";
import Block from "@/components/layouts/block/Block";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import Section from "@/models/Section";
import Text from "@/models/Text";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";
import type TileCollection from "@/models/TileCollection";
import type { Background } from "@/components/backgrounds/types";
import type { Reactive } from "@/utils/reactivity";

export interface PageContentsProps {
  editor: Editor;
  tiles: TileCollection;
  signal?: AbortSignal;
}

function getBackground(tile: Tile): Reactive<Background | null> | undefined {
  if (
    tile instanceof Section ||
    tile instanceof Text ||
    tile instanceof Table ||
    tile instanceof Chart
  ) {
    return tile.background;
  }
  return undefined;
}

export default function PageContents({
  editor,
  tiles,
  signal,
}: PageContentsProps) {
  const { isEditable } = editor;
  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));

  function ref(element: HTMLElement) {
    LayoutEditor.attach({
      element,
      grid: element,
      layoutType: "VERTICAL",
      dropTarget: element,
      editor,
      sectionId: null,
      signal,
    });
  }

  return (
    <main ref={ref}>
      <Each items={tiles}>
        {(tile) => (
          <Block
            editor={editor}
            tileId={tile.id}
            hide={tile.hide}
            background={getBackground(tile)}
          >
            <Item
              editable={isEditable}
              tile={tile}
              tabindex={tabindex}
              resize={tile.dimensions.derive((value) =>
                value === "CUSTOM" ? "all" : null,
              )}
            />
          </Block>
        )}
      </Each>
    </main>
  );
}
