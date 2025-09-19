import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createDropdown, updateDropdown, deleteDropdown } from "./dropdowns.ts";
import {
  CreateDropdownSchema,
  UpdateDropdownSchema,
  DeleteDropdownSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateDropdownSchema)
    .mutation(({ input }) => createDropdown(input)),

  update: pageUpdateProcedure
    .input(UpdateDropdownSchema)
    .mutation(({ input }) => updateDropdown(input)),

  delete: pageUpdateProcedure
    .input(DeleteDropdownSchema)
    .mutation(({ input }) => deleteDropdown(input)),
});
