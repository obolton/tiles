import { z } from "zod";
import { ColorSchema } from "@/schema/Color.ts";

export const DropdownOptionSchema = z.strictObject({
  value: z.string().min(1).max(50),
  color: ColorSchema.nullable().optional(),
});
export type DropdownOptionSchema = z.infer<typeof DropdownOptionSchema>;

export const DropdownOptionsSchema = z
  .array(DropdownOptionSchema)
  .min(1)
  .max(50);
export type DropdownOptionsSchema = z.infer<typeof DropdownOptionsSchema>;

export const CreateDropdownSchema = z.strictObject({
  pageId: z.uuid(),
  title: z.string().max(100).optional(),
  options: DropdownOptionsSchema,
});
export type CreateDropdownSchema = z.infer<typeof CreateDropdownSchema>;

export const UpdateDropdownSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  title: z.string().max(100).nullable().optional(),
  options: DropdownOptionsSchema.optional(),
});
export type UpdateDropdownSchema = z.infer<typeof UpdateDropdownSchema>;

export const DeleteDropdownSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteDropdownSchema = z.infer<typeof DeleteDropdownSchema>;
