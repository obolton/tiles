import TableTab from "./TableTab";
import ColumnTab from "./ColumnTab";
import RowTab from "./RowTab";
import CellTab from "./CellTab";
import If from "@/jsx/if";
import type FloatingToolbar from "@/elements/floating-toolbar/FloatingToolbar";
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
  let toolbar: FloatingToolbar | undefined;

  function ref(element: FloatingToolbar) {
    toolbar = element;
  }

  // Auto-switch tabs when selection type changes
  selectionType.subscribe((type) => {
    if (!toolbar) {
      return;
    }
    if (type === null) {
      toolbar.selectTab(0);
    } else {
      // Contextual tab is always at index 1
      toolbar.selectTab(1);
    }
  });

  return (
    <floating-toolbar
      ref={ref}
      className="primary"
      data-tooltip-position="top"
      aria-label="Table tools"
      name="table-toolbar"
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
    </floating-toolbar>
  );
}
