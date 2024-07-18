declare global {
  namespace PrismaJson {
    type RichText = import("api/src/schema/RichText").RichTextSchema;
  }
}

export {};
