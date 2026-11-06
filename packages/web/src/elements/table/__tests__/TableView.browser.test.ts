import { afterEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { buildRow, buildTableMap } from "doc/tiles/table";
import { orderAfter, orderedEntries } from "doc/placement/ordering";
import { createId } from "doc/id";
import { DragDropEvent, DragState } from "@/utils/drag";
import SharedList from "@/collaboration/SharedList";
import Column from "@/models/Column";
import Row from "@/models/Row";
import type TableView from "@/elements/table/TableView";
import "@/elements/table/TableView";
import "@/styles/tables.css";

interface TableData {
  doc: Y.Doc;
  rowsMap: Y.Map<Y.Map<unknown>>;
  rows: SharedList<Row>;
  columns: SharedList<Column>;
}

function createTableData(rowCount: number, columnCount: number): TableData {
  const doc = new Y.Doc();
  const map = buildTableMap({ rows: rowCount, columns: columnCount });
  doc.getMap("tiles").set("table", map);

  const rowsMap = map.get("rows");
  const columnsMap = map.get("columns");
  if (!(rowsMap instanceof Y.Map) || !(columnsMap instanceof Y.Map)) {
    throw new Error("Table map missing rows or columns");
  }

  return {
    doc,
    rowsMap,
    rows: new SharedList(rowsMap, (id, rowMap) => new Row(id, rowMap)),
    columns: new SharedList(columnsMap, (id, columnMap) => new Column(id, columnMap)),
  };
}

function insertRow({ doc, rowsMap }: TableData, afterId: string | null) {
  const id = createId();
  doc.transact(() => {
    rowsMap.set(id, buildRow(orderAfter(orderedEntries(rowsMap), afterId)));
  });
  return id;
}

function mount({ rows = 5, columns = 3, editable = true } = {}) {
  const data = createTableData(rows, columns);

  const view = document.createElement("table-view");
  view.style.width = "800px";
  view.style.height = "300px";
  view.rows = data.rows;
  view.columns = data.columns;
  view.editable = editable;
  view.updateCell = (row, column, cell) => {
    cell.textContent = `${row.id}/${column.id}`;
  };
  document.body.appendChild(view);

  return { view, data };
}

async function rendered(view: TableView) {
  await vi.waitFor(() => {
    expect(view.body.rows.length).toBeGreaterThan(0);
  });
}

function firstRowIndex(view: TableView) {
  const index = view.body.rows[0]?.ariaRowIndex;
  return index ? parseInt(index, 10) : null;
}

function cell(view: TableView, row: number, column: number) {
  const td = view.querySelector<HTMLTableCellElement>(
    `tr[aria-rowindex="${row}"] > td[aria-colindex="${column}"]`,
  );
  if (!td) {
    throw new Error(`Cell ${row},${column} is not rendered`);
  }
  return td;
}

function columnHeader(view: TableView) {
  const th = view.querySelector<HTMLTableCellElement>("th[scope='col']");
  if (!th) {
    throw new Error("Column header is not rendered");
  }
  return th;
}

function rangeFocus(view: TableView) {
  const [selection] = view.selection;
  return selection?.type === "range"
    ? { row: selection.focus.row.index, column: selection.focus.column.index }
    : null;
}

function dropIndicator(view: TableView) {
  return view.shadowRoot?.querySelector("#drop-indicator") ?? null;
}

function startRangeDrag(view: TableView) {
  cell(view, 0, 0).dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
  cell(view, 1, 1).dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
  expect(rangeFocus(view)).toEqual({ row: 1, column: 1 });
}

function startHeaderDrag(view: TableView) {
  const header = columnHeader(view);
  const state = DragState.attach({ element: header, startX: 0, startY: 0, pointerType: "mouse" });
  const options = { state, dragSource: header, dragPreview: null, bubbles: true };
  header.dispatchEvent(new DragDropEvent("dnd-dragstart", options));
  view.dispatchEvent(new DragDropEvent("dnd-dragover", { ...options, clientX: 150, clientY: 10 }));
  expect(dropIndicator(view)).not.toBeNull();
  return { header, options };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("TableView (browser)", () => {
  describe("editable", () => {
    test("removes every resize handle when editing is disabled", async () => {
      const { view } = mount({ rows: 5, columns: 3 });
      await rendered(view);
      expect(view.querySelectorAll("resize-handle")).toHaveLength(8);

      view.editable = false;
      expect(view.querySelectorAll("resize-handle")).toHaveLength(0);

      view.editable = true;
      expect(view.querySelectorAll("resize-handle")).toHaveLength(8);
    });

    test("does not reuse recycled rows with stale resize handles", async () => {
      const { view } = mount({ rows: 100, columns: 2 });
      await rendered(view);

      view.scrollTop = 1600;
      await vi.waitFor(() => {
        expect(firstRowIndex(view)).toBeGreaterThan(0);
      });

      view.editable = false;
      expect(view.querySelectorAll("resize-handle")).toHaveLength(0);

      view.scrollTop = 0;
      await vi.waitFor(() => {
        expect(firstRowIndex(view)).toBe(0);
      });
      expect(view.querySelectorAll("resize-handle")).toHaveLength(0);
    });
  });

  describe("scrolling", () => {
    test("keeps the scroll position when a jump drains every rendered row", async () => {
      const { view } = mount({ rows: 100, columns: 2 });
      await rendered(view);

      view.scrollTop = 1600;
      await vi.waitFor(() => {
        expect(firstRowIndex(view)).toBeGreaterThan(0);
      });
      expect(view.scrollTop).toBe(1600);
    });
  });

  describe("range selection", () => {
    test("stops extending the range when the pointer is released outside the element", async () => {
      const { view } = mount();
      await rendered(view);
      startRangeDrag(view);

      window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
      cell(view, 2, 2).dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      expect(rangeFocus(view)).toEqual({ row: 1, column: 1 });
    });

    test("stops extending the range when the pointer is cancelled", async () => {
      const { view } = mount();
      await rendered(view);
      startRangeDrag(view);

      window.dispatchEvent(new PointerEvent("pointercancel"));
      cell(view, 2, 2).dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      expect(rangeFocus(view)).toEqual({ row: 1, column: 1 });
    });
  });

  describe("drop indicator", () => {
    afterEach(() => {
      // Release the drag state's window listeners
      window.dispatchEvent(new PointerEvent("pointercancel"));
    });

    test("hides the indicator when the drag ends without a drop", async () => {
      const { view } = mount();
      await rendered(view);
      const { header, options } = startHeaderDrag(view);

      header.dispatchEvent(new DragDropEvent("dnd-dragend", options));
      expect(dropIndicator(view)).toBeNull();
      expect(view.dataset.drop).toBeUndefined();
    });

    test("hides the indicator when the drag leaves the table", async () => {
      const { view } = mount();
      await rendered(view);
      const { options } = startHeaderDrag(view);

      view.dispatchEvent(new DragDropEvent("dnd-dragleave", options));
      expect(dropIndicator(view)).toBeNull();
    });
  });

  describe("reconnection", () => {
    test("rebuilds the rendered rows from the model after being re-inserted", async () => {
      const { view, data } = mount({ rows: 5, columns: 2 });
      await rendered(view);
      const unsubscribe = vi.spyOn(data.rows, "unsubscribe");

      view.remove();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(view.body.rows).toHaveLength(0);
      const inserted = insertRow(data, null);

      document.body.appendChild(view);
      await vi.waitFor(() => {
        expect(view.body.rows).toHaveLength(6);
      });
      const columns = data.columns.value.map((column) => column.id);
      expect(view.body.rows[0]?.dataset.id).toBe(inserted);
      expect(cell(view, 0, 0).textContent).toBe(`${inserted}/${columns[0]}`);
      expect(cell(view, 5, 1).textContent).toBe(`${data.rows.value[5]?.id}/${columns[1]}`);
    });

    test("keeps applying data changes after being re-inserted", async () => {
      const { view, data } = mount({ rows: 3, columns: 2 });
      await rendered(view);

      view.remove();
      document.body.appendChild(view);
      await rendered(view);

      const appended = insertRow(data, data.rows.value.at(-1)?.id ?? null);
      expect(view.body.rows).toHaveLength(4);
      expect(cell(view, 3, 0).textContent).toBe(`${appended}/${data.columns.value[0]?.id}`);
    });

    test("clears the selection when removed", async () => {
      const { view } = mount();
      await rendered(view);
      cell(view, 0, 0).dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
      expect(view.selection.size).toBe(1);

      view.remove();
      expect(view.selection.size).toBe(0);
    });
  });
});
