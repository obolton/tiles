import type { RichTextSchema } from "api/src/schema/RichText";

declare global {
  namespace PrismaJson {
    type RichText = RichTextSchema;
    type TableRowData = { [k: number]: string | RichText | null };
  }
}

export {};
