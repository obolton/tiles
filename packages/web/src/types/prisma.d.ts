import type { RichTextSchema } from "api/schema/RichText";

declare global {
  namespace PrismaJson {
    type RichText = RichTextSchema;
    type TableRowData = { [k: string]: string | RichText | null };
  }
}

export {};
