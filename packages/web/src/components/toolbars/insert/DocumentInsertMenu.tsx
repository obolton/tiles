import InsertTileItems from "./InsertTileItems";
import SectionItems from "./SectionItems";
import Editor from "@/editor/Editor";
import type { JSX } from "jsx/jsx";

/** The default insert menu: content tiles plus root-level section layouts. */
export default function DocumentInsertMenu({ ...props }: JSX.Attributes<"popover-menu">) {
  const editor = Editor.current;
  // Text is typed straight into a document body; text tiles only go inside sections there
  const showText = editor.selection.derive(
    () => !editor.page.body || editor.activeSection !== null,
  );

  return (
    <popover-menu {...props}>
      <InsertTileItems getPlacement={() => editor.contentPlacement} showText={showText} />
      <SectionItems getPlacement={() => editor.sectionPlacement} />
    </popover-menu>
  );
}
