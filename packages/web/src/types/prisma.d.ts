import type { RichTextSchema } from "api/src/schema/RichText";
import type { DropdownOptionsSchema } from "api/src/routes/dropdowns/schema";

declare global {
  namespace PrismaJson {
    type RichText = RichTextSchema;
    type TableRowData = { [k: string]: string | RichText | null };
    type DropdownOptions = DropdownOptionsSchema;
  }
}

export {};
