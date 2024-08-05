import { z } from "zod";

const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: z.number().int().gte(0).lte(15),
});

const ParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  spans: z.array(TextNodeSchema),
});

const ListItemNodeSchema = z.object({
  type: z.literal("listitem"),
  spans: z.array(TextNodeSchema),
});

const ListNodeSchema = z.object({
  type: z.literal("list"),
  listType: z.number().int().gte(0).lte(1),
  children: z.array(ListItemNodeSchema),
});

const BlockNodeSchema = z.discriminatedUnion("type", [
  ParagraphNodeSchema,
  ListNodeSchema,
]);

export const RichTextSchema = z.array(BlockNodeSchema);
export type RichTextSchema = z.infer<typeof RichTextSchema>;
