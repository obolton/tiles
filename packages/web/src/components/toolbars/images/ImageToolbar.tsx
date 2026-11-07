import FormattingTools from "@/components/toolbars/text/FormattingTools";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import ImageTab from "./ImageTab";
import type Image from "@/models/Image";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "reactivity";

export type ImageToolbarTab = "image" | "caption";

export interface ImageToolbarProps {
  image: Image;
  /** The caption editor. */
  editorView: Reactive<EditorView | null>;
  /** The tab to show: the caption tools while the caption is being edited. */
  selectedTab: Reactive<ImageToolbarTab>;
}

export default function ImageToolbar({ image, editorView, selectedTab }: ImageToolbarProps) {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Image tools"
      selectedtab={selectedTab}
    >
      <ImageTab image={image} />

      <toolbar-tab name="caption" label="Caption">
        <FormattingTools editorView={editorView} state={image.state} />
      </toolbar-tab>

      <StyleTab tile={image} />

      <DateTab tile={image} />
    </floating-toolbar>
  );
}
