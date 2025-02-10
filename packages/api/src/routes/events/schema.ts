import { z } from "zod";

export const CreateEventSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().nullable(),
  start: z.string().datetime(),
  end: z.string().datetime().nullable(),
  allDay: z.boolean().optional(),
  timeZone: z.string().optional(),
});
export type CreateEventSchema = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  timeZone: z.string().optional(),
});
export type UpdateEventSchema = z.infer<typeof UpdateEventSchema>;
