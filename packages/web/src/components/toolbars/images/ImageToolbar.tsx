import FormattingTools from "@/components/toolbars/text/FormattingTools";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import AltTab from "./AltTab";
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
      </toolbar-tab>

      <StyleTab tile={image} />

      <AltTab image={image} />
      <DateTab tile={image} />
    </floating-toolbar>
  );
}
