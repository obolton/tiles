import type { RichTextSchema } from "api/schema/RichText";
import type { DropdownOptionsSchema } from "api/routes/dropdowns/schema";

declare global {
  namespace PrismaJson {
    type RichText = RichTextSchema;
    type TableRowData = { [k: string]: string | RichText | null };
    type DropdownOptions = DropdownOptionsSchema;
  }
}

export {};
