import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createTable,
  updateTable,
  insertRow,
  updateRow,
  moveRow,
  deleteRow,
  insertColumn,
  moveColumn,
  updateColumn,
  deleteColumn,
  updateCell,
} from "./tables.ts";
import {
  CreateTableSchema,
  UpdateTableSchema,
  InsertRowSchema,
  UpdateRowSchema,
  MoveRowSchema,
  DeleteRowSchema,
  InsertColumnSchema,
  MoveColumnSchema,
  UpdateColumnSchema,
  DeleteColumnSchema,
  UpdateCellSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateTableSchema)
    .mutation(({ input }) => createTable(input)),

  update: pageUpdateProcedure
    .input(UpdateTableSchema)
    .mutation(({ input }) => updateTable(input)),

  insertRow: pageUpdateProcedure
    .input(InsertRowSchema)
    .mutation(({ input }) => insertRow(input)),

  updateRow: pageUpdateProcedure
    .input(UpdateRowSchema)
    .mutation(({ input }) => updateRow(input)),

  moveRow: pageUpdateProcedure
    .input(MoveRowSchema)
    .mutation(({ input }) => moveRow(input)),

  deleteRow: pageUpdateProcedure
    .input(DeleteRowSchema)
    .mutation(({ input }) => deleteRow(input)),

  insertColumn: pageUpdateProcedure
    .input(InsertColumnSchema)
    .mutation(({ input }) => insertColumn(input)),

  updateColumn: pageUpdateProcedure
    .input(UpdateColumnSchema)
    .mutation(({ input }) => updateColumn(input)),

  moveColumn: pageUpdateProcedure
    .input(MoveColumnSchema)
    .mutation(({ input }) => moveColumn(input)),

  deleteColumn: pageUpdateProcedure
    .input(DeleteColumnSchema)
    .mutation(({ input }) => deleteColumn(input)),

  updateCell: pageUpdateProcedure
    .input(UpdateCellSchema)
    .mutation(({ input }) => updateCell(input)),
});
