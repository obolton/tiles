import { z } from "zod";

export const SortDirection = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof SortDirection>;

export const PaginationSchema = z.object({
  query: z.string().min(1).optional(),
  cursor: z.uuid().optional(),
});
export type PaginationSchema = z.infer<typeof PaginationSchema>;
