import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createTable,
  insertRow,
  deleteRow,
  insertColumn,
  updateColumn,
  deleteColumn,
  updateCell,
} from "./tables.ts";
import {
  CreateTableSchema,
  InsertRowSchema,
  DeleteRowSchema,
  InsertColumnSchema,
  UpdateColumnSchema,
  DeleteColumnSchema,
  UpdateCellSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateTableSchema)
    .mutation(({ input }) => createTable(input)),

  insertRow: pageUpdateProcedure
    .input(InsertRowSchema)
    .mutation(({ input }) => insertRow(input)),

  deleteRow: pageUpdateProcedure
    .input(DeleteRowSchema)
    .mutation(({ input }) => deleteRow(input)),

  insertColumn: pageUpdateProcedure
    .input(InsertColumnSchema)
    .mutation(({ input }) => insertColumn(input)),

  updateColumn: pageUpdateProcedure
    .input(UpdateColumnSchema)
    .mutation(({ input }) => updateColumn(input)),

  deleteColumn: pageUpdateProcedure
    .input(DeleteColumnSchema)
    .mutation(({ input }) => deleteColumn(input)),

  updateCell: pageUpdateProcedure
    .input(UpdateCellSchema)
    .mutation(({ input }) => updateCell(input)),
});
