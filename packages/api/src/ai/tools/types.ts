import { z } from "zod";
import type { ClientTile } from "@/types/tiles.ts";

export interface ToolContext {
  userId: string;
  workspaceId: string;
  pageId: string;
  sectionId: string | null;
  model: string;
  resolveArtifactId: (id: number) => string;
}

export interface Artifact {
  artifact: ClientTile;
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

export interface FunctionToolOptions<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  function: (
    args: z.infer<T>,
    context: ToolContext,
  ) => Promise<Artifact | ActionResult | void>;
}
