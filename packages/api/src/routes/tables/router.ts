import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createTable,
  insertRow,
  updateRow,
  moveRow,
  deleteRows,
  insertColumn,
  moveColumn,
  updateColumn,
  deleteColumns,
  updateCell,
  clearRanges,
} from "./tables.ts";
import {
  CreateTableSchema,
  InsertRowSchema,
  UpdateRowSchema,
  MoveRowSchema,
  DeleteRowsSchema,
  InsertColumnSchema,
  MoveColumnSchema,
  UpdateColumnSchema,
  DeleteColumnsSchema,
  UpdateCellSchema,
  ClearRangesSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateTableSchema)
    .mutation(({ input }) => createTable(input)),

  insertRow: pageUpdateProcedure
    .input(InsertRowSchema)
    .mutation(({ input }) => insertRow(input)),

  updateRow: pageUpdateProcedure
    .input(UpdateRowSchema)
    .mutation(({ input }) => updateRow(input)),

  moveRow: pageUpdateProcedure
    .input(MoveRowSchema)
    .mutation(({ input }) => moveRow(input)),

  deleteRows: pageUpdateProcedure
    .input(DeleteRowsSchema)
    .mutation(({ input }) => deleteRows(input)),

  insertColumn: pageUpdateProcedure
    .input(InsertColumnSchema)
    .mutation(({ input }) => insertColumn(input)),

  updateColumn: pageUpdateProcedure
    .input(UpdateColumnSchema)
    .mutation(({ input }) => updateColumn(input)),

  moveColumn: pageUpdateProcedure
    .input(MoveColumnSchema)
    .mutation(({ input }) => moveColumn(input)),

  deleteColumns: pageUpdateProcedure
    .input(DeleteColumnsSchema)
    .mutation(({ input }) => deleteColumns(input)),

  updateCell: pageUpdateProcedure
    .input(UpdateCellSchema)
    .mutation(({ input }) => updateCell(input)),

  clearRanges: pageUpdateProcedure
    .input(ClearRangesSchema)
    .mutation(({ input }) => clearRanges(input)),
});
