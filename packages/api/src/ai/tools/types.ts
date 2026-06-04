import { z } from "zod";
import type { ClientTile } from "@/types/tiles";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";
import type { DocWriter } from "@/collaboration/DocWriter";

export interface ToolContext extends AuthenticatedPageProcedureContext {
  sectionId: string | null;
  model: string;
  resolveArtifactId: (id: number) => string;
  session: DocWriter;
}

export interface Artifact {
  artifact: ClientTile;
}

export interface TileResult {
  tileId: string;
}

export interface Action {
  readonly type: string;
  readonly data: Record<string, unknown>;
}

export interface ActionEvent {
  action: Action;
}

export interface ActionResult {
  actions: Action[];
}

export type ToolResult = Artifact | ActionResult | TileResult | void;

export interface FunctionToolOptions<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  function: (args: z.infer<T>, context: ToolContext) => Promise<ToolResult>;
}
