import { z } from "zod";
import type { ClientTile } from "@/types/tiles.ts";

export interface ToolContext {
  userId: string;
  workspaceId: string;
  pageId: string;
  sectionId: string;
  model: string;
}

export interface Artifact {
  artifact: ClientTile;
}

export interface FunctionToolOptions<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  function: (args: z.infer<T>, context: ToolContext) => Promise<Artifact>;
}
