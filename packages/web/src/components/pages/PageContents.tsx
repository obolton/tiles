import Each from "@/jsx/each";
import Block from "@/components/layouts/block/Block";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import type Editor from "@/editor/Editor";
import type TileCollection from "@/models/TileCollection";

export interface PageContentsProps {
  editor: Editor;
  tiles: TileCollection;
  signal?: AbortSignal;
}

export default function PageContents({
  editor,
  tiles,
  signal,
}: PageContentsProps) {
  const { isEditable } = editor;
  const tabIndex = isEditable.derive((editable) => (editable ? 0 : undefined));

  function ref(element: HTMLElement) {
    new LayoutEditor({
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
            background={"background" in tile ? tile.background : undefined}
          >
            <Item
              editable={isEditable}
              tile={tile}
              tabIndex={tabIndex}
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
