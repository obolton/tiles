import { z } from "zod";
import { ColorSchema } from "./Color";

const FormatSchema = z.int().gte(0).lte(255);

const SizeSchema = z.number().gte(0.5).lte(2.5);

const AlignSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

const LineHeightSchema = z.number().gte(1).lte(3);

const IndentSchema = z.number().int().gte(1).lte(6);

const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: FormatSchema,
  size: SizeSchema.optional(),
  color: ColorSchema.optional(),
  pending: z.boolean().optional(),
});

const LinkNodeSchema = z.object({
  type: z.literal("link"),
  href: z.string(),
  theme: z.string().optional(),
  children: z.array(TextNodeSchema),
});

const DateNodeSchema = z.object({
  type: z.literal("date"),
  value: z.union([z.iso.datetime(), z.iso.date()]),
  format: FormatSchema,
  size: SizeSchema.optional(),
  color: ColorSchema.optional(),
  theme: z.string().nullable().optional(),
});

const DropdownNodeSchema = z.object({
  type: z.literal("dropdown"),
  dropdownType: z.uuid(),
  value: z.string(),
  format: FormatSchema,
  size: SizeSchema.optional(),
  color: ColorSchema.optional(),
});

const MentionNodeSchema = z.object({
  type: z.literal("mention"),
  userId: z.uuid(),
  displayName: z.string(),
  format: FormatSchema,
  size: SizeSchema.optional(),
  color: ColorSchema.optional(),
});

const InlineNodeSchema = z.discriminatedUnion("type", [
  TextNodeSchema,
  LinkNodeSchema,
  DateNodeSchema,
  DropdownNodeSchema,
  MentionNodeSchema,
]);

const ParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  align: AlignSchema.optional(),
  lineHeight: LineHeightSchema.optional(),
  indent: IndentSchema.optional(),
  children: z.array(InlineNodeSchema),
});

const HeadingNodeSchema = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  align: AlignSchema.optional(),
  lineHeight: LineHeightSchema.optional(),
  indent: IndentSchema.optional(),
  theme: z.string().optional(),
  children: z.array(InlineNodeSchema),
});

const ListItemNodeSchema = z.object({
  type: z.literal("listitem"),
  checked: z.boolean().optional(),
  get children(): z.ZodArray<typeof BlockNodeSchema> {
    return z.array(BlockNodeSchema);
  },
});

const ListNodeSchema = z.object({
  type: z.literal("list"),
  listType: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  children: z.array(ListItemNodeSchema),
});

const CodeNodeSchema = z.object({
  type: z.literal("code"),
  language: z.string(),
  children: z.array(TextNodeSchema),
});

const DividerNodeSchema = z.object({
  type: z.literal("divider"),
});

const QuoteNodeSchema = z.object({
  type: z.literal("quote"),
  children: z.array(
    z.discriminatedUnion("type", [
      ParagraphNodeSchema,
      HeadingNodeSchema,
      ListNodeSchema,
      CodeNodeSchema,
      DividerNodeSchema,
    ]),
  ),
});

const PendingNodeSchema = z.object({
  type: z.literal("pending"),
  children: z.array(
    z.discriminatedUnion("type", [
      ParagraphNodeSchema,
      HeadingNodeSchema,
      ListNodeSchema,
      QuoteNodeSchema,
      CodeNodeSchema,
      DividerNodeSchema,
    ]),
  ),
});

const BlockNodeSchema = z.discriminatedUnion("type", [
  ParagraphNodeSchema,
  HeadingNodeSchema,
  QuoteNodeSchema,
  ListNodeSchema,
  PendingNodeSchema,
  CodeNodeSchema,
  DividerNodeSchema,
]);

export const RichTextSchema = z.array(BlockNodeSchema);
export type RichTextSchema = z.infer<typeof RichTextSchema>;
