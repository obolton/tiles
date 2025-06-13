import { z } from "zod";

const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: z.number().int().gte(0).lte(31),
});

const LinkNodeSchema = z.object({
  type: z.literal("link"),
  href: z.string(),
  theme: z.string().optional(),
  children: z.array(TextNodeSchema),
});

const DateNodeSchema = z.object({
  type: z.literal("date"),
  value: z.union([z.string().datetime(), z.string().date()]),
  format: z.number().int().gte(0).lte(31),
  theme: z.string().nullable().optional(),
});

const InlineNodeSchema = z.discriminatedUnion("type", [
  TextNodeSchema,
  LinkNodeSchema,
  DateNodeSchema,
]);

const ParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  align: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  children: z.array(InlineNodeSchema),
});

const HeadingNodeSchema = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  align: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  theme: z.string().optional(),
  children: z.array(InlineNodeSchema),
});

const ListItemNodeSchema: z.ZodType<{
  type: "listitem";
  checked?: boolean;
  children: (
    | z.infer<typeof ParagraphNodeSchema>
    | z.infer<typeof HeadingNodeSchema>
    | z.infer<typeof QuoteNodeSchema>
    | z.infer<typeof ListNodeSchema>
  )[];
}> = z.object({
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
