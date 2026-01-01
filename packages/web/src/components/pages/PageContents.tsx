import Each from "@/jsx/each";
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
          <Item
            editable={isEditable}
            tile={tile}
            tabindex={tabindex}
            resize={tile.dimensions.derive((value) =>
              value === "CUSTOM" ? "all" : null,
            )}
            showInsertButton
            fullBleed
          />
        )}
      </Each>
    </main>
  );
}
