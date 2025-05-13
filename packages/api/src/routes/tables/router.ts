import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createTable,
  updateTable,
  appendRow,
  deleteRow,
  updateCell,
} from "./tables.ts";
import {
  CreateTableSchema,
  UpdateTableSchema,
  AppendRowSchema,
  DeleteRowSchema,
  UpdateCellSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateTableSchema)
    .mutation(({ input }) => createTable(input)),

  update: pageUpdateProcedure
    .input(UpdateTableSchema)
    .mutation(({ input }) => updateTable(input)),

  appendRow: pageUpdateProcedure
    .input(AppendRowSchema)
    .mutation(({ input }) => appendRow(input)),

  deleteRow: pageUpdateProcedure
    .input(DeleteRowSchema)
    .mutation(({ input }) => deleteRow(input)),

  updateCell: pageUpdateProcedure
    .input(UpdateCellSchema)
    .mutation(({ input }) => updateCell(input)),
});
