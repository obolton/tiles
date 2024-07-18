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

const BlockNodeSchema = z.discriminatedUnion("type", [ParagraphNodeSchema]);

export const RichTextSchema = z.array(BlockNodeSchema);
export type RichTextSchema = z.infer<typeof RichTextSchema>;
