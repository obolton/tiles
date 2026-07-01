import { z } from "zod";

export const SearchPlacesSchema = z.union([
  z.object({
    query: z.string().min(1),
    lat: z.number(),
    long: z.number(),
  }),
  z.object({
    query: z.string().min(1),
    boundingBox: z.array(z.number()).length(4),
  }),
]);
export type SearchPlacesSchema = z.infer<typeof SearchPlacesSchema>;

export const HereAutosuggestQueryResults = z.object({
  items: z.array(
    z.union([
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        resultType: z.string(),
        position: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        address: z.object({
          label: z.string().min(1),
        }),
        mapView: z
          .object({
            north: z.number(),
            east: z.number(),
            south: z.number(),
            west: z.number(),
          })
          .optional(),
      }),
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        resultType: z.enum(["categoryQuery", "chainQuery"]),
        href: z.string().min(1),
      }),
    ]),
  ),
});
export type HereAutosuggestQueryResults = z.infer<typeof HereAutosuggestQueryResults>;
