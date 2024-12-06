import { z } from "zod";

const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: z.number().int().gte(0).lte(15),
});

const ParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  children: z.array(TextNodeSchema),
});

const HeadingNodeSchema = z.object({
  type: z.literal("heading"),
  children: z.array(TextNodeSchema),
});

const QuoteNodeSchema = z.object({
  type: z.literal("quote"),
  children: z.array(TextNodeSchema),
});

const ListItemNodeSchema: z.AnyZodObject = z.object({
  type: z.literal("listitem"),
  value: z.number().int().gte(1),
  children: z.lazy(() => z.array(z.union([TextNodeSchema, ListNodeSchema]))),
});

const ListNodeSchema = z.object({
  type: z.literal("list"),
  listType: z.number().int().gte(0).lte(1),
  children: z.array(ListItemNodeSchema),
});

const RootNodeSchema = z.discriminatedUnion("type", [
  ParagraphNodeSchema,
  HeadingNodeSchema,
  QuoteNodeSchema,
  ListNodeSchema,
]);

export const RichTextSchema = z.array(RootNodeSchema);
export type RichTextSchema = z.infer<typeof RichTextSchema>;
