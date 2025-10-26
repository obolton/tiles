import FormattingTools from "@/components/inputs/RichTextEditor/FormattingTools";
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
      className="bottom-left"
      data-tooltip-position="top"
      aria-label="Image tools"
    >
      <FormattingTools editorView={editorView} state={image.state} />
    </floating-toolbar>
  );
}
