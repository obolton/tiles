import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createTable,
  appendRow,
  deleteRow,
  appendColumn,
  updateColumn,
  deleteColumn,
  updateCell,
} from "./tables.ts";
import {
  CreateTableSchema,
  AppendRowSchema,
  DeleteRowSchema,
  AppendColumnSchema,
  UpdateColumnSchema,
  DeleteColumnSchema,
  UpdateCellSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateTableSchema)
    .mutation(({ input }) => createTable(input)),

  appendRow: pageUpdateProcedure
    .input(AppendRowSchema)
    .mutation(({ input }) => appendRow(input)),

  deleteRow: pageUpdateProcedure
    .input(DeleteRowSchema)
    .mutation(({ input }) => deleteRow(input)),

  appendColumn: pageUpdateProcedure
    .input(AppendColumnSchema)
    .mutation(({ input }) => appendColumn(input)),

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
