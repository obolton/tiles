import InsertTileItems from "./InsertTileItems";
import SectionItems from "./SectionItems";
import Editor from "@/editor/Editor";
import type { JSX } from "jsx/jsx";

/** The default insert menu: content tiles plus root-level section layouts. */
export default function DocumentInsertMenu({ ...props }: JSX.Attributes<"popover-menu">) {
  return (
    <popover-menu {...props}>
      <InsertTileItems getParentId={() => Editor.current.activeSection?.id} />
      <SectionItems />
    </popover-menu>
  );
}
