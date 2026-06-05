import { z } from "zod";
import type { ClientTile, TileType } from "@/types/tiles";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";
import type { DocWriter } from "@/collaboration/DocWriter";

export interface ToolContext extends AuthenticatedPageProcedureContext {
  sectionId: string | null;
  model: string;
  resolveArtifactId: (id: number) => string;
  session: DocWriter;
}

/**
 * TODO: To be removed once table/chart are migrated.
 */
export interface Artifact {
  artifact: ClientTile;
}

export interface TileResult {
  tileId: string;
  type: TileType;
}

export type ToolResult = TileResult | Artifact | void;

export interface FunctionToolOptions<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  function: (args: z.infer<T>, context: ToolContext) => Promise<ToolResult>;
}
