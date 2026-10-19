import { vi } from "vitest";
import * as Y from "yjs";
import type { ServerResponse } from "node:http";
import { DocWriter } from "@/collaboration/DocWriter";
import type { ToolContext, ToolResult } from "@/ai/tools/types";

export const MOCK_TOOL_CONTEXT: ToolContext = {
  res: {} as ServerResponse,
  sessionId: "test-session",
  userId: "test-user",
  isService: false,
  workspaceId: "test-workspace",
  pageId: "test-page",
  sectionId: null,
  model: "test-model",
  session: new DocWriter(new Y.Doc()),
  resolveArtifactId: vi.fn((id: number) => `resolved-${id}`),
};

export function createToolContext(overrides: Partial<ToolContext> = {}): {
  doc: Y.Doc;
  context: ToolContext;
} {
  const doc = new Y.Doc();
  const context: ToolContext = {
    ...MOCK_TOOL_CONTEXT,
    session: new DocWriter(doc),
    ...overrides,
  };
  return { doc, context };
}

export function getTile(doc: Y.Doc, tileId: string): Y.Map<unknown> {
  const tile = doc.getMap<Y.Map<unknown>>("tiles").get(tileId);
  if (!tile) {
    throw new Error(`Expected tile ${tileId}`);
  }
  return tile;
}

export function getCreatedTile(doc: Y.Doc, result: ToolResult): Y.Map<unknown> {
  if (!result || !("tileId" in result)) {
    throw new Error("Expected a tile result");
  }
  return getTile(doc, result.tileId);
}
