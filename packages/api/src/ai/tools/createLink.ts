import { z } from "zod";
import { createLink } from "@/routes/links/links.ts";
import { SizeSchema, getDimensions, CommonTileSchema } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateLinkSchema = z.strictObject({
  sectionId: z.string().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  url: z.string().meta({
    description: "A URL to create a link to",
  }),
  size: SizeSchema,
  ...CommonTileSchema,
});

async function createLinkArtifact(
  args: z.infer<typeof CreateLinkSchema>,
  { pageId, sectionId, resolveArtifactId }: ToolContext,
) {
  const { url, size, background, animation, frame, dock, hide, position } = args;
  const resolvedSectionId = args.sectionId
    ? resolveArtifactId(args.sectionId)
    : sectionId;
  const artifact = await createLink({
    pageId,
    sectionId: resolvedSectionId,
    url,
    background,
    animation,
    frame,
    dock,
    hide: hide ?? undefined,
    ...(position ? { x: position.x, y: position.y } : {}),
    ...getDimensions(size),
  });
  return { artifact };
}

export const CREATE_LINK_TOOL: FunctionToolOptions<typeof CreateLinkSchema> = {
  name: "create_link",
  description: "Creates a link card for a URL.",
  schema: CreateLinkSchema,
  function: createLinkArtifact,
};
