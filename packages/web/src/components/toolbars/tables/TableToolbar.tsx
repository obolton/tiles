import TableTab from "./TableTab";
import ColumnTab from "./ColumnTab";
import RowTab from "./RowTab";
import CellTab from "./CellTab";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import { Switch, Case } from "@/jsx/switch";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";
import type { EditorView } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";
import type { Reactive } from "reactivity";

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

      <Switch value={selectionType}>
        <Case value="column">
          <ColumnTab table={table} getTable={getTable} />
        </Case>
        <Case value="row">
          <RowTab table={table} getTable={getTable} />
        </Case>
        <Case value="range">
          <CellTab editorView={editorView} state={state} />
        </Case>
      </Switch>

      <StyleTab tile={table} />
      <DateTab tile={table} />
    </floating-toolbar>
  );
}
