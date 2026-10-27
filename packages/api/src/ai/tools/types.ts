import { z } from "zod";
import type { TileType } from "doc/types/enums";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";
import type { DocWriter } from "@/collaboration/DocWriter";

export interface ToolContext extends AuthenticatedPageProcedureContext {
  sectionId: string | null;
  resolveArtifactId: (id: number) => string;
  session: DocWriter;
}

export interface TileResult {
  tileId: string;
  type: TileType;
}

export type ToolResult = TileResult | void;

export type ToolOutput = { id: string } | { status: "ok" };

export interface FunctionToolOptions<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  function: (args: z.infer<T>, context: ToolContext) => Promise<ToolResult>;
}
