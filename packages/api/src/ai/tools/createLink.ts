import { z } from "zod";
import { createLink } from "@/routes/links/links.ts";
import { SizeSchema, getDimensions, CoordinatesSchema } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateLinkSchema = z.strictObject({
  sectionId: z.number().int().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  url: z.string().meta({
    description: "A URL to create a link to",
  }),
  size: SizeSchema,
  coordinates: CoordinatesSchema,
});

async function createLinkArtifact(
  args: z.infer<typeof CreateLinkSchema>,
  context: ToolContext,
) {
  const { url, size, coordinates } = args;
  const { pageId, sectionId, resolveArtifactId } = context;
  const resolvedSectionId =
    args.sectionId !== null ? resolveArtifactId(args.sectionId) : sectionId;
  const artifact = await createLink(
    {
      pageId,
      sectionId: resolvedSectionId,
      url,
      ...getDimensions(size),
      lat: coordinates?.lat,
      long: coordinates?.long,
    },
    context,
  );
  return { artifact };
}

export const CREATE_LINK_TOOL: FunctionToolOptions<typeof CreateLinkSchema> = {
  name: "create_link",
  description: "Creates a link card for a URL.",
  schema: CreateLinkSchema,
  function: createLinkArtifact,
};
