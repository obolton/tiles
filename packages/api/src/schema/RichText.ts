import { z } from "zod";

const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: z.number().int().gte(0).lte(31),
  link: z.string().min(5).optional(),
});

const ParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  align: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  children: z.array(TextNodeSchema),
});

const HeadingNodeSchema = z.object({
  type: z.literal("heading"),
  level: z.number().int().gte(1).lte(3),
  align: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  children: z.array(TextNodeSchema),
});

const ListItemNodeSchema: z.AnyZodObject = z.object({
  type: z.literal("listitem"),
  checked: z.boolean().optional(),
  children: z.lazy(() =>
    z.array(
      z.union([
        ParagraphNodeSchema,
        HeadingNodeSchema,
        QuoteNodeSchema,
        ListNodeSchema,
      ]),
    ),
  ),
});

const ListNodeSchema = z.object({
  type: z.literal("list"),
  listType: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  children: z.array(ListItemNodeSchema),
});

const QuoteNodeSchema = z.object({
  type: z.literal("quote"),
  children: z.array(
    z.union([ParagraphNodeSchema, HeadingNodeSchema, ListNodeSchema]),
  ),
});

const RootNodeSchema = z.discriminatedUnion("type", [
  ParagraphNodeSchema,
  HeadingNodeSchema,
  QuoteNodeSchema,
  ListNodeSchema,
]);

export const RichTextSchema = z.array(RootNodeSchema);
export type RichTextSchema = z.infer<typeof RichTextSchema>;
