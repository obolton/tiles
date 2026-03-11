import FormattingTools from "@/components/toolbars/text/FormattingTools";
import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import DateTab from "@/components/toolbars/tiles/DateTab";
import type Image from "@/models/Image";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "@/utils/reactivity";

export interface ImageToolbarProps {
  image: Image;
  editorView: Reactive<EditorView | null>;
}

export default function ImageToolbar({ image, editorView }: ImageToolbarProps) {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Image tools"
    >
      <toolbar-tab name="image" label="Image">
        <FormattingTools editorView={editorView} state={image.state} />
        <TileTools tile={image} />
      </toolbar-tab>

      <toolbar-tab name="style" label="Style">
        <StyleTools tile={image} />
      </toolbar-tab>

      <DateTab tile={image} />
    </floating-toolbar>
  );
}
