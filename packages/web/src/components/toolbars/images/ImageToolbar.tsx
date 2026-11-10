import FormattingTools from "@/components/toolbars/text/FormattingTools";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import AltText from "./AltText";
import type Image from "@/models/Image";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "carillon";

export interface ImageToolbarProps {
  image: Image;
  editorView: Reactive<EditorView | null>;
}

export default function ImageToolbar({ image, editorView }: ImageToolbarProps) {
  return (
    <floating-toolbar className="primary" data-tooltip-position="bottom" aria-label="Image tools">
      <toolbar-tab name="image" label="Image">
        <AltText image={image} />
      </toolbar-tab>

      <toolbar-tab name="caption" label="Caption">
        <FormattingTools editorView={editorView} state={image.state} />
      </toolbar-tab>

      <StyleTab tile={image} />
      <DateTab tile={image} />
    </floating-toolbar>
  );
}
