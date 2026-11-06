import { afterEach, describe, expect, test, vi } from "vitest";
import { BaseReactive, reactive } from "reactivity";
import { DragDropEvent, DragState } from "@/utils/drag";
import type { ListChange, ReactiveList } from "reactivity";
import type TableView from "@/elements/table/TableView";
import type { ColumnItem, RowItem } from "@/elements/table/TableView";
import "@/elements/table/TableView";
import "@/styles/tables.css";

class TestList<T> extends BaseReactive<readonly T[], ListChange<T>> implements ReactiveList<T> {
  readonly #items: T[];

  constructor(items: T[]) {
    super();
    this.#items = items;
  }

  get value(): readonly T[] {
    return this.#items;
  }

  get subscriberCount() {
    return this.subscribers.size;
  }

  insert(index: number, item: T) {
    this.#items.splice(index, 0, item);
    this.notify({ added: [{ item, index }], removed: [], moved: [] });
  }
}

function createRow(id: string): RowItem {
  return { id, height: reactive(32) };
}

function createColumn(id: string): ColumnItem {
  return { id, width: reactive(100), title: reactive(`Column ${id}`) };
}

function mount({ rows = 5, columns = 3, editable = true } = {}) {
  const rowList = new TestList(Array.from({ length: rows }, (_, i) => createRow(`row-${i}`)));
  const columnList = new TestList(
    Array.from({ length: columns }, (_, i) => createColumn(`col-${i}`)),
  );

  const view = document.createElement("table-view");
  view.style.width = "400px";
  view.style.height = "300px";
  view.rows = rowList;
  view.columns = columnList;
  view.editable = editable;
  view.updateCell = (row, column, cell) => {
    cell.textContent = `${row.id}/${column.id}`;
  };
  document.body.appendChild(view);

  return { view, rowList, columnList };
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
      const { view, rowList } = mount({ rows: 5, columns: 2 });
      await rendered(view);
      expect(rowList.subscriberCount).toBe(1);

      view.remove();
      expect(rowList.subscriberCount).toBe(0);
      rowList.insert(0, createRow("row-new"));

      document.body.appendChild(view);
      await vi.waitFor(() => {
        expect(view.body.rows).toHaveLength(6);
      });
      expect(view.body.rows[0]?.dataset.id).toBe("row-new");
      expect(cell(view, 0, 0).textContent).toBe("row-new/col-0");
      expect(cell(view, 5, 1).textContent).toBe("row-4/col-1");
      expect(rowList.subscriberCount).toBe(1);
    });

    test("keeps applying list changes after being re-inserted", async () => {
      const { view, rowList } = mount({ rows: 3, columns: 2 });
      await rendered(view);

      view.remove();
      document.body.appendChild(view);
      await rendered(view);

      rowList.insert(3, createRow("row-appended"));
      expect(view.body.rows).toHaveLength(4);
      expect(cell(view, 3, 0).textContent).toBe("row-appended/col-0");
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
