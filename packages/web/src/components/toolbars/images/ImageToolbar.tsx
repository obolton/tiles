import FormattingTools from "@/components/toolbars/text/FormattingTools";
import TileTools from "@/components/toolbars/tiles/TileTools";
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
      data-tooltip-position="top"
      aria-label="Image tools"
    >
      <FormattingTools editorView={editorView} state={image.state} />

      <TileTools tile={image} />
    </floating-toolbar>
  );
}
