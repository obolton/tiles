import TableTab from "./TableTab";
import ColumnTab from "./ColumnTab";
import RowTab from "./RowTab";
import CellTab from "./CellTab";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import If from "@/jsx/if";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";
import type { EditorView } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";
import type { Reactive } from "@/utils/reactivity";

export interface TableToolbarProps {
  table: Table;
  getTable: () => TableView;
  selectionType: Reactive<"row" | "column" | "range" | null>;
  editorView: Reactive<EditorView | null>;
  state: Reactive<EditorState | null>;
}

export default function TableToolbar({
  table,
  getTable,
  selectionType,
  editorView,
  state,
}: TableToolbarProps) {
  const selectedTab = selectionType.derive((type) => type);

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Table tools"
      name="table-toolbar"
      selectedtab={selectedTab}
    >
      <TableTab table={table} />

      <If condition={selectionType.derive((type) => type === "column")}>
        <ColumnTab table={table} getTable={getTable} />
      </If>

      <If condition={selectionType.derive((type) => type === "row")}>
        <RowTab table={table} getTable={getTable} />
      </If>

      <If condition={selectionType.derive((type) => type === "range")}>
        <CellTab editorView={editorView} state={state} />
      </If>

      <StyleTab tile={table} />
      <DateTab tile={table} />
    </floating-toolbar>
  );
}
